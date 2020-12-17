import * as React from 'react';
import styled from 'styled-components';

import ImagesPreview from './components/ImagesPreview';
import Toolbar from './components/ToolbarWrapper';
import Quill, { quillStyles, mentionHandler, urlHandler, hashtagHandler } from './quill';
import { getAllowedFormattingOptions } from './utils';

interface IProps {
  // === 📘 General ====
  id: string; // Div ID
  value: string; // Editor initial HTML Value
  placeholder?: string; // Placeholder value
  disabled?: boolean; // Allow Editor to be changed or not. @default: false

  onChange?: (html: string) => void;
  onFocus?: () => void; // On Focus callback
  onBlur?: () => void; // On Blur callback
  onKeyDown?: (e: Event) => void; // on Keydown event
  onClick?: (e: React.MouseEvent<HTMLDivElement>) => void; // Click handler
  // === 🖼️ Images Section ===
  images: string[]; // Images URLs
  imagesAddingDisabled: boolean; // Disable images adding
  imagesUploadingHidden: boolean; // Hide images uploading button
  onImageAdd: (url: string) => void;
  onImageUpload: (file: File) => void; // Function that uploads image and adds url to images array
  onImageRemove: (url: string) => void; // Function to call to remove image
  // === 🙎‍Mentions ===
  onMentionSearch: (searchTerm: string, renderList: any, setLoading: () => void) => void;
  // === 🔧 Other ===
  rows?: number; // Number of rows inside textarea
  showToolbar?: boolean; // Show/Hide formatting box (add GIFs, bold, italic etc.)
  isReply?: boolean;
}

const Wrapper = styled.div<{ focused: boolean }>`
  border: 1px solid ${(props) => props.theme.input.border};
  border-radius: 4px 4px 0 0;
  border-bottom-style: dashed;
  background-color: ${(props) => props.theme.input.background};
  word-break: break-word;
  ${(props) => props.focused && `border-color: ${props.theme.input.active.border};`};
  ${quillStyles};
`;

const Editor: React.FC<IProps> = ( props ) => {
  const { value, disabled } = props;

  const toolbarId = `toolbar-${props.id}`;

  const [focused, setFocused] = React.useState<boolean>(false);
  const [initialValue] = React.useState<any>(props.value);
  const [quill, setQuill] = React.useState<any>(undefined);

  /** Focus handler */
  const onFocus = () => {
    setFocused(true);
    if (props.onFocus) {
      props.onFocus();
    }
  };

  /** Blur handler */
  const onBlur = () => {
    setFocused(false);
    if (props.onBlur) {
      props.onBlur();
    }
  };

  /** Keydown handler */
  const onEditorKeyDown = (e: Event): void => {
    if (props.onKeyDown) {
      props.onKeyDown(e);
    }
  };

  /** Change handler */
  const onChange = (_delta: any, _oldContents: any, source: string) => {
    if (props.onChange && source === 'user') {
      // Move cursor to the end if one character is inserted
      // This is a temporary workaround for this issue - https://github.com/quilljs/quill/issues/1882
      // If it's fixed in a new quill version and it makes sense to upgrade, do it and remove this code
      if (quill.root.textContent.length === 1) {
        setTimeout(() => {
          const rng = document.createRange();
          rng.selectNode(quill.root.firstChild);
          rng.setStart(quill.root.firstChild, 1);
          rng.setEnd(quill.root.firstChild, 1);
          const sel = window.getSelection();
          if (sel) {
            sel.removeAllRanges();
            sel.addRange(rng);
          }
        }, 0);
      }
      props.onChange(quill.root.innerHTML);
    }
  };

  React.useEffect(() => {
    /** Create quill instance to work with */
    setQuill(new Quill(`#${props.id}`, {
      formats: [
        'bold',
        'italic',
        'underline',
        'blockquote',
        'list',
        'bullet',
        'code',
        'hashtag',
        'code-block',
        'url',
        'mention',
      ],
      modules: {
        mention: {
          allowedChars: /^[A-Za-z]*$/,
          isolateCharacter: true,
          mentionDenotationChars: ['@'],
          source: (searchTerm: string, renderList: any, mentionChar: string, setLoading: () => void) => {
            if (mentionChar === '@') {
              props.onMentionSearch(searchTerm, renderList, setLoading);
            }
          },
          /** Custom on select handler for mentions. We need to change keys in object */
          onSelect(data: any, callback: any) {
            if (data.id && data.name) {
              callback({
                userId: data.id, // rename id, because server accepts only userId data attribute
                value: data.name, // rename name, because server accepts only userId data attribute
              });
            } else {
              callback(data);
            }
          },
        },
        /** Autoformat turns found text into quill formats or text. Currently applied on hashtags */
        autoformat: {
          hashtag: {
            trigger: /[\s.,;:!?]/, // RegExp for matching text input characters to trigger the match.
            find: /(?:^|\s)#[^\s.,;:!?]+/i, // Global RegExp to search for in the text
            extract: /#([^\s.,;:!?]+)/i, // Additional RegExp to finetune and override the found text match
            transform: '$1', // String or function passed to String.replace() to rewrite find/extract results
            insert: 'hashtag', // Insert name string or embed insert object.
            minLength: 3, // the minimum length the found matches should be
            maxLength: 100, // the maximum length the found matches should be
          },
        },
        toolbar: `#${toolbarId}`,
      },
      placeholder: props.placeholder,
    }));
  }, [] );

  React.useEffect(() => {
    if (quill) {
      // Get standard toolbar module to register custom handlers
      const toolbar = quill.getModule('toolbar');
      toolbar.addHandler('url', urlHandler);
      toolbar.addHandler('hashtag', hashtagHandler);
      toolbar.addHandler('mention', mentionHandler);
      // Add custom event handlers to work with react
      quill.root.addEventListener('focus', onFocus);
      quill.root.addEventListener('blur', onBlur);
      quill.root.addEventListener('keydown', onEditorKeyDown);
      quill.on('text-change', onChange);

      setQuillState(props.disabled);

      if (initialValue) {
        const delta = quill.clipboard.convert(initialValue);
        quill.setContents(delta);
      }

      // Put automatic focus on comment box if it's a reply
      if (props.isReply) {
        setFocused(true);
        quill.focus();
      }

      return () => {
        quill.root.removeEventListener('focus', onFocus);
        quill.root.removeEventListener('blur', onBlur);
        quill.root.removeEventListener('keydown', onEditorKeyDown);
      }
    }
    return undefined;
  }, [quill] );

  React.useEffect(() => {
    // Clear quill content if value is empty from props
    if (value.length <= 0 && quill) {
      /**
       * APIs causing text to change may also be called with a "silent" source, in which case text-change will not be emitted
       * We need this to prevent onChange calling that removes alert immediately, but for empty comment text we need to show alert
       * @see {@link https://quilljs.com/docs/api/#text-change}
       */
      quill.setText('', 'api');
    }
  }, [value] );

  React.useEffect(() => {
    // Quill Editor should be disabled
    setQuillState(disabled);
  }, [disabled] );

  /**
   * Enable or Disable comment writing
   *
   * @param {boolean} [disable=false] - if true disables writing inside textarea
   */
  const setQuillState = (disable: boolean = false) => {
    if (quill) {
      return disable ? quill.disable() : quill.enable();
    }
  };

  return (
    <Wrapper focused={focused}>
      <div className={focused ? 'ql-wrapper focused' : 'ql-wrapper'}>
        {/* Editor */}
        <div id={props.id} />
        {/* Images Preview */}
        <ImagesPreview items={props.images} onRemove={props.onImageRemove} />
        {/* Toolbar with formatting options and images uploading */}
        <Toolbar
          id={toolbarId}
          options={getAllowedFormattingOptions()}
          hidden={!props.showToolbar}
          onImageAdd={props.onImageAdd}
          onImageUpload={props.onImageUpload}
          imagesAddingDisabled={props.imagesAddingDisabled}
          imagesUploadingHidden={props.imagesUploadingHidden}
        />
      </div>
    </Wrapper>
  );
}

Editor.defaultProps = {
  disabled: false,
  onFocus: () => false,
  placeholder: 'Write a comment',
};

export default Editor;
