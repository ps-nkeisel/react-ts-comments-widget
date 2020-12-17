import { makeDevLog } from '@vuukle/utils';
import debounce from 'lodash/debounce';
import throttle from 'lodash/throttle';
import { action, computed, observable } from 'mobx';

import CommentBox, { alertMessages, CommentErrors } from './models/CommentBox';
import SpamValidationStore from './models/SpamValidationModel';
import ToxicityValidationStore from './models/ToxicityValidationModel';

import commentsStore from 'modules/CommentList/store';
import realtimeTypingStore from 'modules/RealtimeTyping/store';
import { commentsApis } from 'services/apis';
import {
  logCommentToPublisher,
  logCommentToWordPress,
  postRealtimeMessage,
  RealtimeMessageTypes,
} from 'services/communication';
import { translation } from 'services/translation';
import urlSearchParams from 'services/urlSearchParams';
import widgetStore from 'stores/widgetStore';
import { saveCommentForComparison, compareWithPreviousComment } from '../utils';
import authStore from 'stores/authStore';
import userStore from 'stores/userStore';

import { clearTypedComment, getTypedComment, saveTypedComment } from 'utils';

class WriteBox extends CommentBox {
  @observable
  public toxicityModel: ToxicityValidationStore = new ToxicityValidationStore();
  public spamModel: SpamValidationStore = new SpamValidationStore();

  constructor(private parentID: number, private successCallback: (comment: Comments.ServerComment) => void) {
    super();
    const typedComment = getTypedComment('English');
    const matchesHost: boolean = typedComment.host && typedComment.host === widgetStore.article.host;
    const matchesArticle: boolean = typedComment.articleId && typedComment.articleId === widgetStore.article.id;

    if (typedComment.comment && typedComment.parentID === parentID && matchesArticle && matchesHost) {
      this.value = typedComment.comment;
    }
  }

  /** Realtime typing helpers using debounce and throttle to prevent events calling too much */
  private startTypingThrottle = throttle(() => (realtimeTypingStore.currentUserWriting = true), 15000);
  private stopTypingDebounce = debounce(() => (realtimeTypingStore.currentUserWriting = false), 15000);

  /**
   * Determines if commenting is disabled
   * @return {boolean}
   */
  @computed
  public get disabled(): boolean {
    return urlSearchParams.get('d') === 'true' || widgetStore.commentingDisabled;
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

    if (widgetStore.realtime) {
      realtimeTypingStore.userReplyID = this.parentID;
      this.startTypingThrottle();
      this.stopTypingDebounce();
    }

    saveTypedComment(commentText, 'English', this.parentID);
  }

  public get value(): string {
    return this._value;
  }

  @action
  public onSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    if (e) {
      e.preventDefault();
    }

    this.inProgress = true;
    this.alert.value = null;

    /** If a makeshift anon session exists and user has no token - authorize before posting their comment */
    if (widgetStore.anonymousCommenting && userStore.details && userStore.isAnonymous && !userStore.token) {
      if (authStore.isCookiesAllowed) {
        // Authorize user via regular guest sign-in method if cookies are enabled
        await authStore.signInWithoutPassword(userStore.details.email, userStore.details.name);
      } else if (!widgetStore.hasAnonFallback) {
        // Use a fallback sign in which will authorize the user and try keeping the token cookie in platform
        await authStore.signInAnonFallback(userStore.details.email, userStore.details.name);
      }
    }

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

    this.inProgress = true;
    this.alert.value = null;
    /** 🏁 And only now we are ready to send comment to the server */
    try {
      const response = await commentsApis.post(
        this.computedHTML,
        this.toxicityModel.value || 0,
        compareWithPreviousComment(this.text) ? 95 : this.spamModel.value || 0,
        this.parentID,
        0,
        'en'
      );

      if (response.data && response.data.state === 0) {
        this.successCallback(response.data);
        if (this.text.length) {
          saveCommentForComparison(this.text);
        }
        this.alert.value = alertMessages[CommentErrors.success];
        // Do not show "Load n new comments" button
        // if current user sent the new comment.
        if (widgetStore.realtime) {
          if (realtimeTypingStore.newCommentsCount) {
            realtimeTypingStore.newCommentsCount += 1;
          }
        }
        // Updated total comments count
        commentsStore.totalComments++;
        // Send Event to publisher
        logCommentToPublisher(response.data);
        // Send event to sync with WP if comment approved
        if (commentsStore.syncWithWP) {
          // Sync data with WordPress
          logCommentToWordPress(response.data);
        }
        // Post messages to websocket if realtime is active
        if (widgetStore.realtime) {
          if (this.parentID !== 0) {
            // if replying to a comment - send the id of the reply
            // This is done so that websocket server can track if a reply was posted or not
            postRealtimeMessage({
              type: RealtimeMessageTypes.CommentPosted,
              commentId: this.parentID,
              replyCount: realtimeTypingStore.replyCount,
            });
            postRealtimeMessage({ type: RealtimeMessageTypes.StopWriting, commentId: this.parentID });
          } else {
            // If posting a new comment, send commentId of null
            postRealtimeMessage({ type: RealtimeMessageTypes.CommentPosted });
            // Also send the stopWriting with no commentId since there is no parent comment
            postRealtimeMessage({ type: RealtimeMessageTypes.StopWriting });
          }
        }
        // Add comment to user's posted comments
        userStore.postedCommentIDs.push(response.data.id);
        // Clear typed comment from localStorage after the comment is successfully submitted
        clearTypedComment('English');
      } else {
        this.alert.value = alertMessages[CommentErrors.moderation];
        // If submitted comment went to moderation, it should also be cleared
        clearTypedComment('English');
      }

      this.value = ''; // Clear comment box
      this.images.items = [];
    } catch (error) {
      if (error.message === 'ip_blocked' || error.message === 'email_blocked') {
        // For IP and email block we show moderation message, so might as well clear it during these errors
        clearTypedComment('English');
      }
      this.alert.value = alertMessages[error.message] || alertMessages.unknown;
    } finally {
      this.inProgress = false;
    }
  };
}

export default WriteBox;
