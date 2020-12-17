import { getTextFromHTML } from '@vuukle/utils';
import min from 'lodash/min';
import uniqueId from 'lodash/uniqueId';
import { action, computed, observable, when } from 'mobx';

import { translation } from 'services/translation';
import urlSearchParams from 'services/urlSearchParams';
import Alert, { IAlertValue } from 'stores/models/Alert';
import ImageUpload from './ImageUpload';

export enum CommentErrors {
  // Front-end
  blank_comment = 'blank_comment',
  similar_comment = 'similar_comment',
  long_comment = 'long_comment',
  // Server
  repeat_comment = 'repeat_comment',
  spammer = 'spammer',
  success = 'success',
  moderation = 'moderation',
  ip_blocked = 'ip_blocked',
  email_blocked = 'email_blocked',
}

/* ================================================
* Alerts Util
================================================ */
const getAlerts = (): { [key: string]: IAlertValue } => {
  return {
    [CommentErrors.blank_comment]: { type: 'error', message: translation.common.blankComment },
    [CommentErrors.similar_comment]: { type: 'error', message: translation.messages.almostSame },
    [CommentErrors.long_comment]: { type: 'warning', message: `${translation.messages.charlimits}` },
    // Server
    [CommentErrors.repeat_comment]: { type: 'warning', message: translation.messages.alreadySubmitted },
    [CommentErrors.spammer]: { type: 'warning', message: translation.messages.spammerComment },
    [CommentErrors.success]: { type: 'success', message: translation.messages.commentAdded },
    [CommentErrors.moderation]: { type: 'warning', message: translation.messages.moderationMessage },
    // The reason we're showing moderation message for ip and email block is to trick the spammer,
    // into thinking that they've successfully sent the message which will possibly prevent them,
    // from making lots of emails or changing IPs to continue spamming.
    [CommentErrors.ip_blocked]: { type: 'warning', message: translation.messages.moderationMessage },
    [CommentErrors.email_blocked]: { type: 'warning', message: translation.messages.moderationMessage },
    unknown: { type: 'error', message: translation.messages.errorPosting },
  };
};

export let alertMessages: { [key: string]: IAlertValue } = getAlerts();

/**
 * We need to call this function 2 times:
 * 1. To init alert Messages
 * 2. To update alert messages to follow new translation once we receive corresponding porthole message
 * {@see index.tsx}
 */
export function updateAlertsTranslation() {
  alertMessages = getAlerts();
}

abstract class CommentBox {
  /** Uniquer id for each created comment box (used as id of textarea) */
  public readonly id: string = uniqueId('write-comment-');
  /** Comment value from textarea or content editable */
  @observable
  protected _value: string = '';
  /** Comment box is focused */
  @observable
  public focused: boolean = false;
  /**
   * By default textarea has minimized view to don't show all of the elements.
   * But once user focuses on textarea at least once we expand it
   */
  @observable
  public minimized: boolean = true;
  /** Comment posting/editing progress */
  @observable
  public inProgress: boolean = false;
  /** Alert to notify user about any errors or to show success posting message */
  @observable
  public alert = new Alert();
  /** Uploaded Images URLs */
  @observable
  public images: ImageUpload = new ImageUpload(1, (alert) => (this.alert.value = alert));
  // === 🔧 Configurable from outside of the widget
  /** If true, then box is collapsed by default (only main comment box) and we show button that sets this value to true and shows comment box */
  @observable
  public collapsed: boolean;
  /** If true, then comment box is hidden completely. We also hide 'reply' button for this logic check the comment item store. */
  @observable
  public hidden: boolean = urlSearchParams.get('hideCommentBoxWithButton') === 'true';
  /** Chars limit to post comment. Publisher can customize it but anyway max limit is 20000 */
  public static readonly lengthLimit: number =
    min([parseInt(urlSearchParams.get('maxChars') || '3000', 10), 20000]) || 3000;

  protected constructor() {
    this.collapsed = urlSearchParams.get('hideCommentBox') === 'true';
    /** Expand textarea rows once user focused textarea box */
    when(() => this.focused, () => (this.minimized = false));
  }

  public abstract set value(commentText: string);
  public abstract get value(): string;

  @computed
  protected get text(): string {
    return getTextFromHTML(this._value);
  }

  /**
   * Creates HTML that is ready to be posted to server
   */
  @computed
  protected get computedHTML(): string {
    if (!this.value && !this.images.items.length) {
      return '';
    }

    let commentHTML = this.value
      .trim()
      // Remove empty tags
      .replace(/(?!<br>|<br\/>|<br \/>)(<[^\/>][^>]*><\/[^>]+>)/gim, '')
      // Convert more than 3 new lines within <p>
      .replace(/(<p>(<br>|<br\/>|<br \/>)<\/p>){3,}/gim, '<br><br>')
      // Convert more than 3 new lines into 2
      .replace(/(<br>|<br\/>|<br \/>){3,}/gim, '<br><br>')
      // Remove more than 3 spaces
      .replace(/ {3,}/g, '   ')
      .trim();

    if (this.images.items.length > 0) {
      this.images.items.forEach((imageUrl) => (commentHTML += ` <p><img src="${imageUrl}"></p>`));
    }

    return commentHTML;
  }

  /** ➕/➖ Calculates how many characters user is allowed to type */
  @computed
  public get allowedCharactersCount(): number {
    return CommentBox.lengthLimit - this.text.length;
  }

  /** Form focus handler */
  @action
  public onFocus = (): void => {
    this.minimized = false;
    this.focused = true;
  };

  /** Form blur handler */
  @action
  public onBlur = (): void => {
    this.focused = false;
  };

  /**
   * Determines if commenting is disabled
   * @return {boolean}
   */
  public abstract get disabled(): boolean;

  /**
   * Form submit handler
   * @return {void}
   */
  public abstract onSubmit(e: React.FormEvent<HTMLFormElement>): void;

  /**
   * Pre submit util function to verify if comment that is ready to be posted/edited is a valid comment
   * @return {Promise} - error or resolves true on success
   */
  @action
  protected preSubmit = (): Promise<CommentErrors | boolean> =>
    new Promise<CommentErrors | boolean>((resolve, reject) => {
      /** Check if comment text is empty (without tags) */
      if (!this.text && !this.computedHTML.match(/<img [^>]*src="[^"]*"[^>]*>/gm)) {
        this.alert.value = alertMessages[CommentErrors.blank_comment];
        reject(CommentErrors.blank_comment);
      } else if (this.text.length > CommentBox.lengthLimit) {
        this.alert.value = {
          ...alertMessages[CommentErrors.long_comment],
          message: alertMessages[CommentErrors.long_comment].message + ` ${CommentBox.lengthLimit}`,
        };
        reject(CommentErrors.long_comment);
      }
      resolve(true);
    });
}

export default CommentBox;
