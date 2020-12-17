import commentsStore from 'modules/CommentList/store';
import widgetStore from 'stores/widgetStore';
import CommentBox, { alertMessages, CommentErrors } from './models/CommentBox';
import transliterationStore from './models/Transliteration';

import { commentsApis } from 'services/apis';
import { logCommentToPublisher, logCommentToWordPress } from 'services/communication';
import urlSearchParams from 'services/urlSearchParams';
import { saveCommentForComparison, compareWithPreviousComment } from '../utils';
import authStore from 'stores/authStore';
import userStore from 'stores/userStore';

import { clearTypedComment, getTypedComment, saveTypedComment } from 'utils';

class ForeignBox extends CommentBox {
  public toggleBox = transliterationStore.toggleBox;
  public toggleLanguage = transliterationStore.toggleLanguage;
  /**
   * Hide language toggle button if main lang is english.
   * We need this because we also load simple foreign box for IE even if language is english
   */
  public hideToggleButton = widgetStore.language === 'en';

  constructor(private parentID: number, private successCallback: (comment: Comments.ServerComment) => void) {
    super();
    const typedComment = getTypedComment('Foreign');
    const matchesHost: boolean = typedComment.host && typedComment.host === widgetStore.article.host;
    const matchesArticle: boolean = typedComment.articleId && typedComment.articleId === widgetStore.article.id;

    if (typedComment.comment && typedComment.parentID === parentID && matchesArticle && matchesHost) {
      this.value = typedComment.comment;
    }
  }

  /**
   * Determines if commenting is disabled
   * @return {boolean}
   */
  public get disabled(): boolean {
    return urlSearchParams.get('d') === 'true' || widgetStore.commentingDisabled;
  }

  public set value(commentText: string) {
    this._value = commentText;
    saveTypedComment(commentText, 'Foreign', this.parentID);
  }

  public get value(): string {
    return this._value;
  }

  get language() {
    return transliterationStore.language;
  }

  /** Since we can't control textarea value with google transliteration library, we are forced to update value using HTML when it's needed */
  private updateTextareaValue() {
    const textarea = document.querySelector(`#${this.id}`);
    if (textarea instanceof HTMLTextAreaElement) {
      textarea.value = this.value;
    }
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

    /** If a makeshift anon session exists and user has no token - authorize before posting their comment */
    if (widgetStore.anonymousCommenting && userStore.details && userStore.isAnonymous && !userStore.token) {
      if (authStore.isCookiesAllowed) {
        // Authorize user via regular guest sign-in function if cookies are enabled
        await authStore.signInWithoutPassword(userStore.details.email, userStore.details.name);
      } else if (!widgetStore.hasAnonFallback) {
        // Use a fallback sign in which will authorize the user and try keeping the token cookie in platform
        await authStore.signInAnonFallback(userStore.details.email, userStore.details.name);
      }
    }

    this.value = this.getTextareaValue(); // Update value to work with it
    this.inProgress = true;
    this.alert.value = null;

    try {
      await this.preSubmit();
    } catch (err) {
      console.warn('error', err); // tslint:disable-line
      this.inProgress = false;
      return;
    }

    /** 🏁 And only now we are ready to send comment to the server */
    try {
      const response = await commentsApis.post(
        this.computedHTML,
        0,
        compareWithPreviousComment(this.text) ? 95 : 0,
        this.parentID,
        0,
        (document as any).documentElement.lang || 'en'
      );

      if (response.data && response.data.state === 0) {
        this.successCallback(response.data);
        if (this.text.length) {
          saveCommentForComparison(this.text);
        }
        this.alert.value = alertMessages[CommentErrors.success];
        // Updated total comments count
        commentsStore.totalComments++;
        // Send Event to publisher
        logCommentToPublisher(response.data);
        // Send event to sync with WP if comment approved
        if (commentsStore.syncWithWP) {
          // Sync data with WordPress
          logCommentToWordPress(response.data);
        }
        // Add comment to user's posted comments
        userStore.postedCommentIDs.push(response.data.id);
        // Clear typed comment from localStorage after the comment is successfully submitted
        clearTypedComment('Foreign');
      } else {
        this.alert.value = alertMessages[CommentErrors.moderation];
        // If submitted comment went to moderation, it should also be cleared
        clearTypedComment('Foreign');
      }

      this.value = ''; // Clear comment box
      this.images.items = [];
      this.updateTextareaValue();
    } catch (error) {
      if (error.message === 'ip_blocked' || error.message === 'email_blocked') {
        // For IP and email block we show moderation message, so might as well clear it during these errors
        clearTypedComment('Foreign');
      }
      this.alert.value = alertMessages[error.message] || alertMessages.unknown;
    } finally {
      this.inProgress = false;
    }
  };
}

export default ForeignBox;
