import CommentBox, { alertMessages, CommentErrors } from 'modules/WriteComment/stores/models/CommentBox';
import widgetStore from 'stores/widgetStore';

import { getTextFromHTML, makeDevLog } from '@vuukle/utils';
import { commentsApis } from 'services/apis';

class ForeignEditBox extends CommentBox {
  /**
   * Hide language toggle button if main lang is english.
   * We need this because we also load simple foreign box for IE even if language is english
   */
  public hideToggleButton = widgetStore.language === 'en';

  constructor(
    private commentID: number,
    initialText: string,
    private successCallback: (comment: Comments.ServerComment) => void
  ) {
    super();

    /** 🔧 Expand all textarea function on the start of usage */
    this.minimized = false;

    /**
     * ⚠ Since server returns full HTML including images and widget uses it separately we need to parse that HTML.
     * For Foreign comment box we don't have functionality to post images or any modifications, so we just get text from the text box, but
     * with saving new lines and tabs
     */
    const commentText = initialText.replace(/<br( ?\/?)>/, '\n');
    this.value = getTextFromHTML(commentText);
  }

  /** Edit comment box cannot be disabled */
  public get disabled() {
    return false;
  }

  public set value(commentText: string) {
    this._value = commentText;
  }

  public get value(): string {
    return this._value;
  }

  /** Since we can't create contolled textarea because of google transliteration library we need to get value from textarea like this */
  private getTextareaValue() {
    const textarea = document.querySelector(`#${this.id}`);
    if (textarea instanceof HTMLTextAreaElement) {
      return textarea.value;
    }
    return '';
  }

  public onSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    if (e) {
      e.preventDefault();
    }

    this.value = this.getTextareaValue(); // Update value to work with it
    this.inProgress = true;
    this.alert.value = null;

    try {
      await this.preSubmit();
    } catch (err) {
      makeDevLog(err, 'error');
      this.inProgress = false;
      return;
    }

    /** Call API to edit comment */
    try {
      const response = await commentsApis.edit(this.commentID, this.computedHTML);
      if (response.success) {
        this.alert.value = alertMessages[CommentErrors.success];
        this.successCallback(response.data);
      }
    } catch (error) {
      this.alert.value = alertMessages[error.message] || alertMessages.unknown;
    } finally {
      this.inProgress = false;
    }
  };
}

export default ForeignEditBox;
