import { action, computed, decorate, observable, reaction, when } from 'mobx';
import get from 'lodash/get';
import { commentFlagAPIs, commentsApis, commentVotesAPIs, followerAPIs, userActionsAPIs } from 'services/apis';

import authStore from 'stores/authStore';
import userStore from 'stores/userStore';

import RealtimeStore from 'modules/RealtimeTyping/store';

import { translation } from 'services/translation';
import Alert from 'stores/models/Alert';
import widgetStore from 'stores/widgetStore';

import { decodeString, kFormatter, makeDevLog, makeSafeHTML, removeHTMLTags } from '@vuukle/utils';
import {
  callSSOMethod,
  openLinkInModal,
  openLinkWithPlatform,
  openModalDislikes,
  openModalLikes,
  openModalWidgetAuth,
  openModalWidgetProfile,
  reportEvent,
} from 'services/communication';
import urlSearchParams from 'services/urlSearchParams';
import deviceInfo from 'services/deviceInfo';
import { timeAgo } from 'utils';

export class Comment {
  /** Is comment in progress */
  public loading: boolean = false;
  /** Comment alert to notify about actions progress  */
  public bottomAlert = new Alert();
  public topAlert = new Alert();
  /** Replies feed */
  public replies: Comment[] = [];
  /** Parent comment */
  public parentComment: Comment | null = null;
  /** Comment Details */
  public data: Comments.Comment;
  /** Comment Likes */
  public likes: { loading: boolean; count: number };
  /** Comment Downvotes */
  public dislikes: { loading: boolean; count: number };
  /** Comment is Highlighted */
  @observable
  public highlighted = false;
  /** Commented user's stats */
  public userActions: {
    comments: number;
    emotes: number;
    loaded: boolean;
    votes: number;
    recommendations: number;
    replies: number;
    followers: number;
  };
  /** Show reply textarea */
  public showReplyBox: boolean = false;
  public showReplyButton: boolean =
    urlSearchParams.get('hideCommentBoxWithButton') !== 'true' && !widgetStore.commentingDisabled;
  /**
   * Show/Hide Box box to provide password. User can be authorized without password,
   * but some actions require password to be entered to proceed. For example, comment removal.
   */
  @observable
  public showPasswordProtection: boolean = false;
  /** Comment is minimized */
  public collapsed: boolean = false;
  /** Determines if comment is in edit mode. Users can edit their comments */
  @observable
  private _editMode: boolean = false;

  constructor(
    comment: Comments.ServerComment,
    private selfRemove: (item: Comment) => void,
    parentComment: Comment | null = null,
    isRealTime?: boolean
  ) {
    this.data = {
      authorType: comment.authorType,
      commentText: comment.commentText,
      createdTimestamp: comment.createdTimestamp,
      edited: comment.edited,
      id: comment.id,
      name: decodeString(comment.name),
      parentId: comment.parentId,
      pictureUrl: comment.pictureUrl,
      state: comment.state,
      timeago: timeAgo(comment.createdTimestamp),
      userId: comment.userId,
      userPoints: kFormatter(comment.userPoints || 0),
    };

    this.likes = { count: comment.likeCount, loading: false };
    this.dislikes = { count: comment.dislikeCount, loading: false };

    this.userActions = {
      comments: 0,
      emotes: 0,
      followers: 0,
      loaded: false,
      recommendations: 0,
      replies: 0,
      votes: 0,
    };

    this.parentComment = parentComment;

    // If a comment was loaded through Realtime connection they get highlighted
    // with this condition, we make sure they don't infinitely stay highlighted
    if (isRealTime) {
      setTimeout(() => (this.highlighted = false), 30000);
    }

    try {
      this.data.name = decodeURIComponent(this.data.name);
    } catch (e) {} // tslint:disable-line

    /** Exit from edit mode once user sign out */
    reaction(
      () => userStore.isAuthorized,
      (authorized) => {
        if (!authorized) {
          this._editMode = false;
        }
      }
    );
  }

  public static parseMentionsHTML = (commentHTML: string) => {
    const doc = document.createElement('div');
    doc.innerHTML = commentHTML;
    const mentions = doc.querySelectorAll('.mention');

    Array.from(mentions).forEach((mentionNode: HTMLDataElement) => {
      const anchorMention = document.createElement('a');
      anchorMention.classList.add('mention');
      anchorMention.setAttribute('href', `https://news.vuukle.com/profile/${mentionNode.dataset.userId}`);
      anchorMention.setAttribute('target', '_blank');
      anchorMention.innerHTML = mentionNode.innerHTML;

      (mentionNode.parentNode as HTMLElement).insertBefore(anchorMention, mentionNode);
      (mentionNode.parentNode as HTMLElement).removeChild(mentionNode);
    });

    return doc.innerHTML;
  };

  /**
   * Determines if currently logged in user is owner of that comment
   * @return {boolean} true if authenticated user is owner of the comments, otherwise false
   */
  get isOwner(): boolean {
    return this.data.userId === (userStore.details && userStore.details.id);
  }

  /**
   * Commenter is blocked by currently authorized user
   */
  get isBlocked(): boolean {
    if (this.isOwner) {
      return false;
    }
    return userStore.blockedIDs.indexOf(this.data.userId) >= 0;
  }

  @computed
  get liked(): boolean {
    return userStore.likes.indexOf(this.data.id) > -1;
  }

  set liked(liked: boolean) {
    if (liked) {
      userStore.likes.push(this.data.id);
    } else {
      userStore.likes = userStore.likes.filter((id: number) => id !== this.data.id);
    }
  }

  @computed
  get disliked(): boolean {
    return userStore.dislikes.indexOf(this.data.id) > -1;
  }

  set disliked(disliked: boolean) {
    if (disliked) {
      userStore.dislikes.push(this.data.id);
    } else {
      userStore.dislikes = userStore.dislikes.filter((id: number) => id !== this.data.id);
    }
  }

  /**
   * Get edit mode state
   * @return {boolean} true if toggled and false if not
   */
  public get editMode(): boolean {
    return this._editMode;
  }

  /** Switch edit mode */
  public set editMode(enable: boolean) {
    this._editMode = enable;
  }

  /**
   * Open Authentication for user based on configuration
   * @return {void}
   */
  public openAuth = async (data?: any) => {
    if (authStore.withSSO) {
      return callSSOMethod();
    }

    if (widgetStore.anonymousCommenting && userStore.isAnonymous && !userStore.token) {
      await this.performAnonAuth();
      if (typeof data.callback === 'function') {
        data.callback();
      }
      return;
    }

    // If not SSO then call modal auth
    return openModalWidgetAuth(data);
  };

  /** format comment text for render inside rect */
  public getCommentTextForRender = () => Comment.parseMentionsHTML(makeSafeHTML(this.data.commentText));
  /** format comment text to get only text without any html tags etc. */
  public getCommentTextOnly = () => removeHTMLTags(this.data.commentText);

  /**
   * @public
   * @description like or dislike comment based on current state
   * @return {void}
   */
  // TODO: create decorator for methods with required authorization
  public toggleLike = async () => {
    /** This action requires authentication */
    if (!userStore.isAuthorized || (!userStore.token && userStore.isAnonymous)) {
      return this.openAuth({ likeComment: this.data.id, callback: this.toggleLike });
    }

    if (this.data.userId === (userStore.details && userStore.details.id)) {
      this.bottomAlert.value = { message: translation.messages.ownCommentVote, type: 'error', timeout: 3500 };
    } else {
      this.liked ? this.unlike() : this.like();
    }
  };

  /**
   * @public
   * @description downvote or delete downvote of the comment based on current state
   * @return {void}
   */
  public toggleDownvote = async () => {
    /** This action requires authentication */
    if (!userStore.isAuthorized || (!userStore.token && userStore.isAnonymous)) {
      return this.openAuth({ dislikeComment: this.data.id, callback: this.toggleDownvote });
    }

    if (this.data.userId === (userStore.details && userStore.details.id)) {
      this.bottomAlert.value = { message: translation.messages.ownCommentVote, type: 'error', timeout: 3500 };
    } else {
      this.disliked ? this.deleteDownvote() : this.downvote();
    }
  };

  /**
   * @public
   * @description open modal to share comment and report it to platform
   * @param {'google' | 'twitter' | 'email' | 'facebook'} social - social network to share
   * @return {void}
   */
  public share = (social: 'twitter' | 'email' | 'facebook' | 'whatsapp' | 'link'): void => {
    const openWindow = (shareLink: string) =>
      window.open(
        shareLink,
        'shareWindow',
        'status = 1, height = 500, width = 420, resizable = 0, top=200, left=400, screenX=400, screenY=200'
      );

    const url = encodeURIComponent(widgetStore.article.url + '#commentID-' + this.data.id);
    const commentText = this.data.commentText.replace(/<(?:.|\n)*?>/gm, '').substring(0, 75);

    switch (social.toLocaleLowerCase()) {
      case 'twitter':
        openWindow(`https://twitter.com/share?url=${url}&text=${this.data.name} commented: '${commentText}...'`);
        reportEvent('comments_share_twitter');
        return;
      case 'facebook':
        openWindow(`https://www.facebook.com/share.php?u=${url}&quote=${commentText}...`);
        reportEvent('comments_share_facebook');
        return;
      case 'link':
        const urlInstance = new URL(widgetStore.article.url);
        urlInstance.hash = `#commentID-${this.data.id}`;
        openLinkInModal(`${process.env.API_URL}/stats/External?source=comments_share_link&url=${urlInstance.href}`);
        reportEvent('comments_share_link');
        return;
      case 'whatsapp':
        /**
         * For mobile we are going to use the api.whatsapp.com link to share
         * For PC the web version
         */
        if (deviceInfo.isMobile) {
          openLinkWithPlatform(
            'https://api.whatsapp.com/send?text=' +
              encodeURIComponent(this.data.name + 'commented ' + commentText + '...') +
              '%0D' +
              encodeURIComponent(url)
          );
        } else {
          openWindow(`https://web.whatsapp.com/send?text=${this.data.name} commented '${commentText}...'

          ${url}`);
        }
        return;
      case 'email':
        openLinkWithPlatform(
          decodeURIComponent(`mailto:to?subject=comment | ${widgetStore.article.title}&body=${commentText}

          ${widgetStore.article.url}`)
        );

        return;
      default:
        return;
    }
  };

  /**
   * @public
   * @description Report comment
   * @return {Promise}
   */
  public report = async (): Promise<any> => {
    /** If user is not authenticated first ask to sign in */
    if (!userStore.isAuthorized || (!userStore.token && userStore.isAnonymous)) {
      return this.openAuth({ reportComment: this.data.id, callback: this.report });
    }

    /** Ask to confirm action */
    const flag = window.confirm(translation.messages.flagQuestion);
    if (!flag) {
      return;
    }

    try {
      const reportResponse = await commentFlagAPIs.post(this.data.id);
      if (reportResponse.success) {
        this.bottomAlert.value = { message: translation.messages.flaggedMessage, type: 'success', timeout: 3500 };
      } else if (reportResponse.result === 'Already flagged') {
        this.bottomAlert.value = { message: translation.messages.alreadyReported, type: 'warning', timeout: 3500 };
      }
    } catch (err) {
      if (process.env.NODE_ENV === 'development') {
        console.error('commentFlagAPIs.post error:', err); // tslint:disable-line
      }
    }
  };

  public remove = async (): Promise<any> => {
    /** Action requires password authentication */
    if (!userStore.details || !userStore.details.isPasswordEntered) {
      this.showPasswordProtection = !this.showPasswordProtection;
      return;
    }

    const confirmation = window.confirm(translation.messages.removalConfirmation);
    if (!confirmation) {
      return;
    }

    try {
      const response = await commentsApis.delete(this.data.id);
      if (response.success) {
        this.data.commentText = '[Comment deleted by user]'; // TODO: change to new state enum once changes on server are ready
      }
    } catch (err) {
      this.bottomAlert.value = { type: 'error', message: translation.messages.errorPosting };
    }
  };

  /**
   * @public
   * @description Reject comment - available ONLY for moderators action.
   * On success just remove self.
   * @return {void}
   */
  public reject = async (): Promise<any> => {
    // Check if user is logged in using password
    if (!get(userStore, ['details', 'isPasswordEntered'], false)) {
      this.bottomAlert.value = {
        message: `The following alert message is present when user is logged not by password:
 To perform this action authorization requires password.
 Please authenticate into your account using password on
 <a href="https://admin.vuukle.com" target="_blank">admin.vuukle.com</a> and reload this page.`,
        type: 'warning',
      };
    } else {
      // If user is authenticated with a password then try to reject the comment
      try {
        const statusChangeResponse = await commentsApis.changeStatus(this.data.id);
        if (statusChangeResponse.success) {
          this.bottomAlert.value = {
            message: translation.moderation.commentIsRejected,
            timeout: 2000,
            type: 'success',
          };
          setTimeout(() => this.selfRemove(this), 2000);
        }
      } catch (err) {
        this.bottomAlert.value = {
          message: 'Comment has not been rejected. Please try again later or contact with support.',
          timeout: 4000,
          type: 'error',
        };
      }
    }
  };

  /**
   * On comment edit callback
   * @param {object} comment - server comment
   * @return void
   */
  public editComment = (comment: Comments.ServerComment): void => {
    this.data.commentText = comment.commentText;
    this.data.state = comment.state;
    this.data.edited = true;

    if (comment.state === 2) {
      this.bottomAlert.value = { type: 'warning', message: translation.messages.moderationMessage, timeout: 4000 };
      // Once this alert closed after timout remove comment itself from the feed since it's on moderation now
      when(
        () => !this.bottomAlert.value,
        () => this.selfRemove(this)
      );
    }
    this.editMode = false;
  };

  /**
   * @public
   * Blocks commenter by ID.
   * Comments components for blocked users have no content and just display: 'This author is blocked'
   * @return {Promise<void>}
   */
  public blockCommenter = async (): Promise<void> => {
    // unauthorized users can't block anyone
    if (!userStore.isAuthorized) {
      return this.openAuth({ blockUser: this.data.userId });
    }

    // User can't block himself/herself
    if (this.isOwner) {
      return;
    }

    const confirmed = confirm(translation.messages.userBlockConfirmation);
    if (!confirmed) {
      return;
    }

    try {
      await userStore.blockUser(this.data.userId);
    } catch (err) {
      this.bottomAlert.value = { type: 'error', message: translation.messages.errorPosting, timeout: 5000 };
      makeDevLog('error', 'blockCommenter error:', err);
    }
  };

  /**
   * @public
   * @param {Object} comment - Server response comment to add as reply
   * @return {void}
   */
  public addReply = (comment: Comments.ServerComment): void => {
    this.replies.unshift(new Comment(comment, this.removeReply, this));
    /** Send the reply count to realtime store so that websocket can use it to deliver updated reply counts for comments */
    if (widgetStore.realtime) {
      RealtimeStore.replyCount = this.replies.length;
    }
  };

  /**
   * @public
   * @description show/hide textarea to reply
   * @return {void}
   */
  public toggleReplyBox = (): void => {
    this.showReplyBox = !this.showReplyBox;
  };

  /**
   * @public
   * Sends message to open modal and show view 'comment likes' based on ID
   * @return {void}
   */
  public toggleCommentLikesView = (): void => openModalLikes(this.data.id);

  /**
   * @public
   * Sends message to open modal and show view 'comment dislikes' based on ID
   * @return {void}
   */
  public toggleCommentDislikesView = (): void => openModalDislikes(this.data.id);

  /**
   * @public
   * Send a follow API request with the userId of the comment author
   */
  public followUser = async () => {
    /** This action requires authentication */
    if (!userStore.isAuthorized) {
      return this.openAuth({ followUser: this.data.userId, fromComment: this.data.id });
    }

    try {
      const followResponse = await followerAPIs.follow(this.data.userId);
      if (followResponse.success) {
        this.bottomAlert.value = {
          message: `${translation.messages.youAreFollowing} ${this.data.name}!`,
          type: 'success',
        };
        userStore.addToFollowed(this.data.userId);
        this.userActions.followers++;
        return true;
      }
      throw new Error(followResponse.errors[0]);
    } catch (err) {
      if (process.env.NODE_ENV === 'development') {
        console.error('FollowerAPI error', err); // tslint:disable-line
      }

      this.bottomAlert.value = {
        message:
          err.message === 'private_profile' ? 'This user has a private profile and can not be followed' : err.message,
        type: 'error',
      };
      return false;
    }
  };

  /**
   * @public
   * Send a unfollow API request with the userId of the comment author
   */
  public unfollowUser = async () => {
    /** This action requires authentication */
    if (!userStore.isAuthorized) {
      return this.openAuth();
    }

    try {
      const unfollowResponse = await followerAPIs.unfollow(this.data.userId);
      if (unfollowResponse.success) {
        this.bottomAlert.value = {
          message: `${translation.messages.youAreNotFollowing} ${this.data.name}!`,
          type: 'success',
        };
        userStore.removeFromFollowed(this.data.userId);
        if (this.userActions.followers !== 0) {
          this.userActions.followers--;
        }
        return true;
      }
      throw new Error(unfollowResponse.errors[0]);
    } catch (err) {
      if (process.env.NODE_ENV === 'development') {
        console.error('FollowerAPI error', err); // tslint:disable-line
      }

      this.bottomAlert.value = {
        message: err.message,
        type: 'error',
      };
      return false;
    }
  };

  /**
   * @public
   * Get current follower numbers
   */
  public getFollowerCount = async () => {
    try {
      const followersResponse = await followerAPIs.getFollowerCount(this.data.userId);
      if (followersResponse.success) {
        this.userActions.followers = followersResponse.data;
      }
      return true;
    } catch (err) {
      if (process.env.NODE_ENV === 'development') {
        console.error('FollowerAPI error', err); // tslint:disable-line
      }
      return false;
    }
  };

  /**
   * @public
   * @description Minimize comment UI
   * @return {void}
   */
  public collapse = (): void => {
    this.collapsed = !this.collapsed;
  };

  /**
   * @public
   * @description Send message to the platform to open commenter profile
   * @return {void}
   */
  public showCommenterProfile = (): void => {
    openModalWidgetProfile({
      avatar: this.data.pictureUrl,
      commentId: this.data.id,
      id: this.data.userId,
      // Unauthorized users or the owners of their own profiles can't follow/unfollow
      isAuthorized: userStore.details !== null,
      isFollowed: userStore.isFollowing(this.data.userId),
      isOwner: this.isOwner,
      name: this.data.name,
      points: this.data.userPoints,
      hideFullProfile: widgetStore.disabledOptions.includes('fullProfile'),
    });
    reportEvent('profile_modal');
  };

  /**
   * @public
   * @description Removes reply from this Comment object
   * @param {Comment} reply - reply instance to find and remove
   * @return {void}
   */
  public removeReply = (reply: Comment): void => {
    this.replies = this.replies.filter((replyItem) => replyItem !== reply);
  };

  /**
   * If anonymous commenting is enabled and user has no token yet - get their real data
   */
  private performAnonAuth = async () => {
    /** If a makeshift anon session exists and user has no token - authorize before posting their comment */
    if (userStore.details) {
      if (authStore.isCookiesAllowed) {
        // Authorize user with makeshift credentials via regular guest sign-in method
        await authStore.signInWithoutPassword(userStore.details.email, userStore.details.name);
      } else if (!widgetStore.hasAnonFallback) {
        // Use a fallback sign in which will authorize the user and try keeping the token cookie in platform
        await authStore.signInAnonFallback(userStore.details.email, userStore.details.name);
      }
    }
  };

  /**
   * @private
   * @description like comment
   * @return {Promise<boolean>>}
   */
  @action
  private like = async (): Promise<boolean> => {
    this.likes.loading = true;
    this.liked = true;
    this.likes.count++;

    // If the user has already disliked the comment,but wants to upvote, we must clear the dislike first
    if (this.disliked) {
      await this.deleteDownvote();
    }

    try {
      const likeResponse = await commentVotesAPIs.post(this.data.id);
      if (likeResponse.success) {
        return true;
      }
      throw new Error(likeResponse.errors[0]);
    } catch (err) {
      if (process.env.NODE_ENV === 'development') {
        console.error('commentVotesAPIs.post error', err); // tslint:disable-line
      }

      this.likes.count--;
      this.bottomAlert.value = {
        message:
          err.message === 'cant_vote_for_own_comment'
            ? translation.messages.ownCommentVote
            : translation.messages.alreadyVoted,
        type: 'error',
      };
      return false;
    } finally {
      this.likes.loading = false;
    }
  };

  /**
   * @private
   * @description unlike (remove a placed like) from comment
   * @return {Promise<boolean>>}
   */
  @action
  private unlike = async (): Promise<boolean> => {
    this.likes.loading = true;
    this.liked = false;
    this.likes.count--;

    try {
      await commentVotesAPIs.delete(this.data.id);
      return true;
    } catch (err) {
      if (process.env.NODE_ENV === 'development') {
        console.error('commentVotesAPIs.delete error', err); // tslint:disable-line
      }
      return false;
    } finally {
      this.likes.loading = false;
    }
  };

  /**
   * @private
   * @description downvote comment
   * @return {Promise<boolean>>}
   */
  @action
  private downvote = async (): Promise<boolean> => {
    this.dislikes.loading = true;
    this.disliked = true;
    this.dislikes.count++;

    // If the user has already liked the comment,but wants to downvote, we must clear the like first
    if (this.liked) {
      await this.unlike();
    }

    try {
      const downvoteResponse = await commentVotesAPIs.post(this.data.id, 1);
      if (downvoteResponse.success) {
        return true;
      }
      throw new Error(downvoteResponse.errors[0]);
    } catch (err) {
      if (process.env.NODE_ENV === 'development') {
        console.error('commentVotesAPIs.post error', err); // tslint:disable-line
      }

      this.dislikes.count--;
      this.bottomAlert.value = {
        message:
          err.message === 'cant_vote_for_own_comment'
            ? translation.messages.ownCommentVote
            : translation.messages.alreadyVoted,
        type: 'error',
      };
      return false;
    } finally {
      this.dislikes.loading = false;
    }
  };

  /**
   * @private
   * @description delete a downvote of comment
   * @return {Promise<boolean>>}
   */
  @action
  private deleteDownvote = async (): Promise<boolean> => {
    this.dislikes.loading = true;
    this.disliked = false;
    this.dislikes.count--;

    try {
      await commentVotesAPIs.delete(this.data.id, 1);
      return true;
    } catch (err) {
      if (process.env.NODE_ENV === 'development') {
        console.error('commentVotesAPIs.delete error', err); // tslint:disable-line
      }
      return false;
    } finally {
      this.dislikes.loading = false;
    }
  };

  /**
   * @public
   * @description fetch the user action stats to display on a hover card
   * @return {Promise<boolean>>}
   */
  public getUserActions = async (): Promise<boolean> => {
    try {
      this.userActions.loaded = false;
      const results = await userActionsAPIs.get(this.data.userId);
      if (results.success) {
        const { comments, replies, votes, emotes, recommendations, followers } = results.data;
        this.userActions = {
          ...this.userActions,
          comments,
          emotes,
          followers,
          loaded: true,
          recommendations,
          replies,
          votes,
        };
        return true;
      } else {
        return false;
      }
    } catch (err) {
      if (process.env.NODE_ENV === 'development') {
        console.error('userActionAPIs.get error', err); // tslint:disable-line
      }
      return false;
    }
  };
}

decorate(Comment, {
  bottomAlert: observable,
  collapsed: observable,
  data: observable,
  dislikes: observable,
  likes: observable,
  loading: observable,
  parentComment: observable,
  replies: observable,
  showReplyBox: observable,
  showReplyButton: observable,
  topAlert: observable,
  userActions: observable,

  isOwner: computed,

  addReply: action,
  collapse: action,
  editComment: action,
  getUserActions: action,
  reject: action,
  remove: action,
  removeReply: action,
  showCommenterProfile: action,
  toggleReplyBox: action,
});

export default Comment;
