import { Sources } from 'quill';
import React from 'react';
import ReactDOM from 'react-dom';
import throttle from 'lodash/throttle';
import MentionList from './components/MentionList';

enum Keys {
  TAB = 'Tab',
  ENTER = 'Enter',
  ESCAPE = 'Escape',
  UP = 38,
  DOWN = 40,
}

export interface IOptions {
  /** Callback function to handle the search term */
  source: (textAfter: string, renderList: any, mentionChar: string, showLoading: () => void) => void;
  /* Callback for selected item */
  onSelect: (item: any, insertItem: (item: any) => void) => void;
  /** Allowed characters that will trigger mention */
  allowedChars: RegExp;
  /** Whether or not the denotation character(s) should be isolated. For example, to avoid mentioning in an email. */
  isolateCharacter: boolean;
  /** Minimum number of characters after the @ symbol triggering a search request */
  minChars: number;
  /** Maximum number of characters after the @ symbol triggering a search request */
  maxChars: number;
  /** Additional top offset of the mention container position */
  offsetTop: number;
  /** Additional left offset of the mention container position */
  offsetLeft: number;
  /** Whether to show the use denotation char in the inserted item or not */
  showDenotationChar: boolean;
  /** Add throttling timeout to don't call api instantly after each char enter */
  throttleTimeout: number;
}

class Mention {
  private data: any[] = [];
  private mountNode: HTMLDivElement = document.createElement('div');
  private cursorPos: number;
  private mentionCharPos: number;

  private isLoading: boolean;
  private isOpen: boolean;

  private options: IOptions = {
    onSelect: (data: any, insertItem: any) => insertItem(data),
    source: () => false,

    allowedChars: /^[a-zA-Z0-9_]*$/,
    isolateCharacter: true,
    maxChars: 31,
    minChars: 3,
    offsetLeft: 0,
    offsetTop: 2,
    showDenotationChar: true,
    throttleTimeout: 800,
  };

  constructor(public quill: any, options: any) {
    Object.assign(this.options, options);

    this.mountNode.style.display = 'none';
    this.mountNode.style.position = 'absolute';
    this.mountNode.classList.add('ql-mention-list-container');
    this.quill.container.appendChild(this.mountNode);

    quill.on('text-change', this.handleQuillTextChange);
    quill.on('selection-change', this.handleQuillSelectionChange);

    // Register quill keyboard events to prevent default behaviour
    quill.keyboard.addBinding({ key: Keys.TAB }, this.handleSelectButtonClick);
    quill.keyboard.bindings[9].unshift(quill.keyboard.bindings[9].pop());
    quill.keyboard.addBinding({ key: Keys.ENTER }, this.handleSelectButtonClick);
    quill.keyboard.bindings[13].unshift(quill.keyboard.bindings[13].pop());
    quill.keyboard.addBinding({ key: Keys.ESCAPE }, this.handleCloseButtonClick);
    quill.keyboard.addBinding({ key: Keys.UP }, this.handleListNavigationClick);
    quill.keyboard.addBinding({ key: Keys.DOWN }, this.handleListNavigationClick);
  }

  // === Quill Keys Handlers
  public handleSelectButtonClick = (): boolean => !this.isOpen; // Just prevent default behaviour
  public handleListNavigationClick = (): boolean => !this.isOpen; // Just prevent default behaviour

  public handleCloseButtonClick = (): boolean => {
    if (this.isOpen) {
      this.hideList();
      return false;
    }
    return true;
  };

  // === Quill Change Handlers
  private handleQuillTextChange = (delta: any, oldDelta: any, source: Sources) => {
    if (source === 'user') {
      this.onSomethingChange();
    } else if (source === 'api' && this.quill.getLength() <= 1) {
      // Trigger change when it's done by API only if text is empty (when comment posted)
      // NOTE: length is should be <= 1, because cleared empty text has length 1
      this.hideList();
    }
  };

  /** Handles text selection and <- -> arrows navigation */
  private handleQuillSelectionChange = (range: any, oldRange: any, source: Sources): void => {
    if (range && range.length === 0) {
      this.onSomethingChange();
    } else {
      // 🔴 Sorry, it has to have timeout, so React Click event will be called before this. Maybe, we can fix it later.
      setTimeout(() => this.hideList(), 0);
    }
  };

  private onSomethingChange = throttle(() => {
    const range = this.quill.getSelection();
    if (range === null) {
      return;
    }
    this.cursorPos = range.index;

    const currentFormat = this.quill.getFormat(this.cursorPos);
    if (currentFormat['code-block']) {
      return;
    }

    const startPos = Math.max(0, this.cursorPos - this.options.maxChars);
    const beforeCursorPos = this.quill.getText(startPos, this.cursorPos - startPos);
    const mentionCharIndex = beforeCursorPos.lastIndexOf('@');

    if (mentionCharIndex > -1) {
      if (
        this.options.isolateCharacter &&
        !(mentionCharIndex === 0 || !!beforeCursorPos[mentionCharIndex - 1].match(/\s/g))
      ) {
        this.hideList();
        return;
      }

      this.mentionCharPos = this.cursorPos - (beforeCursorPos.length - mentionCharIndex);
      const textAfter = beforeCursorPos.substring(mentionCharIndex + 1);

      if (textAfter.length >= this.options.minChars && this.hasValidChars(textAfter)) {
        const mentionChar = beforeCursorPos[mentionCharIndex];
        this.options.source(textAfter, this.renderList.bind(this, mentionChar), mentionChar, this.setLoading);
      } else {
        this.hideList();
      }
    } else {
      this.hideList();
    }
  }, this.options.throttleTimeout);

  private renderList = (mentionChar: string, data: any) => {
    this.data = data;
    this.isLoading = false;

    if (Array.isArray(data) && data.length > 0) {
      this.renderReactList();
      this.showList();
    } else {
      this.hideList();
    }
  };

  private handleItemSelect = (itemIndex: number) => {
    const item = this.data[itemIndex];
    if (!item) {
      return;
    }
    this.options.onSelect(item, (asyncData: any) => this.insertItem(asyncData));
  };

  /** Insert selected item into Quill text box */
  public insertItem(data: any): void {
    if (!this.options.showDenotationChar) {
      data.denotationChar = '';
    }

    this.quill.deleteText(this.mentionCharPos, this.cursorPos - this.mentionCharPos, 'user');
    this.quill.insertEmbed(this.mentionCharPos, 'mention', data, 'user');
    this.quill.insertText(this.mentionCharPos + 1, ' ', 'user');
    this.quill.setSelection(this.mentionCharPos + 2, 0, 'user');

    this.hideList();
  }

  // === API

  // === DOM Managements
  public setMentionContainerPosition() {
    const containerPos = this.quill.container.getBoundingClientRect();
    const mentionCharPos = this.quill.getBounds(this.mentionCharPos);
    const containerHeight = this.mountNode.offsetHeight;

    let topPos = this.options.offsetTop;
    let leftPos = this.options.offsetLeft;

    // handle horizontal positioning
    leftPos += mentionCharPos.left;

    if (this.containerRightIsNotVisible(leftPos, containerPos)) {
      const containerWidth = this.mountNode.offsetWidth + this.options.offsetLeft;
      const quillWidth = containerPos.width;
      leftPos = quillWidth - containerWidth;
    }

    // handle vertical positioning
    // Attempt to align the mention container with the bottom of the quill editor
    topPos += mentionCharPos.bottom;

    // default to the top if the bottom is not visible
    if (this.containerBottomIsNotVisible(topPos, containerPos)) {
      let overMentionCharPos = this.options.offsetTop * -1;

      overMentionCharPos += mentionCharPos.top;

      topPos = overMentionCharPos - containerHeight;
    }

    this.mountNode.style.top = `${topPos}px`;
    this.mountNode.style.left = `${leftPos}px`;

    this.mountNode.style.visibility = 'visible';
  }

  public containerBottomIsNotVisible(topPos: any, containerPos: any) {
    const mentionContainerBottom = topPos + this.mountNode.offsetHeight + containerPos.top;
    return mentionContainerBottom > window.pageYOffset + window.innerHeight;
  }

  public containerRightIsNotVisible(leftPos: any, containerPos: any) {
    const rightPos = leftPos + this.mountNode.offsetWidth + containerPos.left;
    const browserWidth = window.pageXOffset + document.documentElement.clientWidth;
    return rightPos > browserWidth;
  }

  // === Utils
  private setLoading = () => {
    this.isLoading = true;
    this.isOpen = true;
    this.showList();
  };

  private hasValidChars = (s: string): boolean => this.options.allowedChars.test(s);

  private showList() {
    this.mountNode.style.visibility = 'hidden';
    this.mountNode.style.display = '';
    this.setMentionContainerPosition();
    this.renderReactList();
    this.isOpen = true;
  }

  private hideList() {
    this.mountNode.style.display = 'none';
    this.isOpen = false;
    this.renderReactList();
  }

  private renderReactList = () => {
    if (this.isLoading) {
      ReactDOM.render(<span>Loading...</span>, this.mountNode);
    } else if (this.isOpen && this.data.length > 0) {
      ReactDOM.render(<MentionList items={this.data} onSelect={this.handleItemSelect} />, this.mountNode);
    } else {
      ReactDOM.render(<></>, this.mountNode);
    }
  };
}

export default Mention;
