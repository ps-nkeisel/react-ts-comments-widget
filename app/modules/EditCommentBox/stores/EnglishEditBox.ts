import CommentBox, { alertMessages, CommentErrors } from 'modules/WriteComment/stores/models/CommentBox';
import SpamValidationModel from 'modules/WriteComment/stores/models/SpamValidationModel';
import ToxicityValidationModel from 'modules/WriteComment/stores/models/ToxicityValidationModel';
import { translation } from 'services/translation';

import { makeDevLog } from '@vuukle/utils';
import { commentsApis } from 'services/apis';

class EnglishEditBox extends CommentBox {
  public toxicityModel: ToxicityValidationModel = new ToxicityValidationModel();
  public spamModel: SpamValidationModel = new SpamValidationModel();

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
     * So we need to get and remove images from the server HTML response, add to this.images and set parsed HTML to this.commentHTML
     *
     * We also use Array.from to support older browsers as DOM elements forEach doesn't work there.
     */
    const wrapper = document.createElement('div');
    wrapper.innerHTML = initialText;
    const imgTags = wrapper.querySelectorAll('img');
    Array.from(imgTags).forEach((img: HTMLImageElement) => {
      this.images.add(img.getAttribute('src') as string);
      if (wrapper.contains(img)) {
        img.remove();
      }
    });
    // Remove empty paragraph tags
    Array.from(wrapper.querySelectorAll('p:empty')).forEach((p: HTMLParagraphElement) => p.remove());

    this.value = wrapper.innerHTML;
  }

  /** Edit comment box cannot be disabled */
  public get disabled() {
    return false;
  }

  public set value(commentText: string) {
    this._value = commentText;

    // Remove alerts on comment change
    if (commentText.length > 0) {
      this.alert.value = null;
    }
    /** Reset spam model on every comment change */
    this.spamModel.value = 0;
    /** Calculate toxicity on comment change */
    if (this.toxicityModel.enabled) {
      this.toxicityModel.getValue(this.text, 1000);
    }
  }

  public get value(): string {
    return this._value;
  }

  public onSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    if (e) {
      e.preventDefault();
    }

    this.inProgress = true;
    this.alert.value = null;

    try {
      await this.preSubmit();
    } catch (err) {
      makeDevLog(err, 'error');
      this.inProgress = false;
      return;
    }

    /** Check toxicity if needed */
    if (this.toxicityModel.enabled) {
      if (this.toxicityModel.loading) {
        await this.toxicityModel.getValue(this.text);
      }

      if (this.toxicityModel.value > this.toxicityModel.limit) {
        this.alert.value = {
          message: translation.messages.toxicityLimit.replace('%d', this.toxicityModel.limit.toString()),
          type: 'warning',
        };
        this.inProgress = false;
        return;
      }
    }

    /** Check spam if enabled */
    if (this.spamModel.enabled) {
      if (!this.spamModel.value) {
        this.spamModel.value = await this.spamModel.getValue(this.text);
      }

      if (this.spamModel.value > this.spamModel.limit && !this.spamModel.confirmed) {
        this.inProgress = false;
        this.spamModel.confirmed = true;
        return;
      }
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

export default EnglishEditBox;
