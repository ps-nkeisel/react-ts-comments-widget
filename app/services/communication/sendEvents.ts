import userStore from 'stores/userStore';
import widgetStore from 'stores/widgetStore';
import authStore from 'stores/authStore';
import { windowProxy } from './windowProxy';
import { observe, IValueDidChange } from 'mobx';

if (process.env.NODE_ENV === 'development') {
  (window as any).windowProxy = windowProxy;
}

export const syncInitialLoadPorthole = (response: any): void => {
  if (response instanceof Object) {
    let shares;
    try {
      shares = JSON.parse(response.data.shares);
    } catch (err) {
      shares = {};
    }

    windowProxy.post({
      articleData: {
        commentCount: response.data.article.commentCount,
        recommendations: response.data.recommendCount,
        shares,
      },
      emotes: response.data.emotes.emotes,
    });
  }
};

export const modalMessage = (type: string, data?: any) => {
  if (widgetStore.modalLoaded) {
    windowProxy.post({ modalData: { hideModal: false, type, data } });
  } else {
    // Notify platform to load modal
    // Share available login types with modal
    notifyPlatformOfLoadModal();

    const disposer = observe(widgetStore, 'modalLoaded', (ev: IValueDidChange<boolean>) => {
      if ((ev as any).newValue) {
        disposer();
        windowProxy.post({ modalData: { hideModal: false, type, data } });
      }
    }, true);
  }
}

/** Send message to open modal widget with render option 'login' */
export const openModalWidgetAuth = (data?: any) => modalMessage('login', data || {});

/**
 * Open modal app with render option 'profile' (show user activity on current site)
 * @param {Object} profile - it can be of two types user data from comments and from user profile
 */
export const openModalWidgetProfile = (profile: {
  id: string;
  isAuthorized?: boolean;
  isFollowed?: boolean;
  isOwner?: boolean;
  points: number | string;
  avatar?: string | null;
  commentId?: number;
  name: string;
  hideFullProfile: boolean;
}) => modalMessage('profile', profile);

/**
 * Open modal app to render comment likes
 * @param {number} id - comment id
 */
export const openModalLikes = (id: number): void => modalMessage('likes', { id });

/**
 * Open modal app to render comment dislikes
 * @param {number} id - comment id
 */
export const openModalDislikes = (id: number): void => modalMessage('dislikes', { id });

/**
 * Share message to open modal window with link text so user can copy it
 * @param {string} link - url that user should see to copy
 */
export const openLinkInModal = (link: string) => modalMessage('link', { link });

export const openLinkWithPlatform = (link: string) => windowProxy.post({ openBrowserLink: link })

/**
 * Once comment added share some data with publisher
 * Message way: comments widget -> platform -> publisher
 * @param comment - comment object from response
 */
export function logCommentToPublisher(comment: { commentText: string; name: string }) {
  windowProxy.post({
    syncWidget: { commentAdded: true },
    vuukle_event: {
      comment: comment.commentText,
      email: userStore.details && userStore.details.email,
      eventType: 'comment',
      name: comment.name,
    },
  });
}

/**
 * Once comment added log action to WordPress so it can create comment in a WP dashboard
 * Message way: comments -> platform -> wordPress
 * @param comment
 */
export function logCommentToWordPress(comment: {
  id: number;
  name: string;
  userId: string;
  commentText: string;
  parentId: number;
}) {
  const dateAdded = new Date().toISOString();

  windowProxy.post({
    vuukle_event: {
      comment_ID: comment.id,
      comment_agent: '',
      comment_approved: 1,
      comment_author: comment.name,
      comment_author_IP: '',
      comment_author_url: `https://news.vuukle.com/profile/${comment.userId}/`,
      comment_content: comment.commentText,
      comment_date: dateAdded,
      comment_date_gmt: dateAdded,
      comment_karma: '',
      comment_parent: comment.parentId,
      comment_post_ID: widgetStore.article.id,
      comment_type: '',
      email: userStore.details && userStore.details.email,
      eventType: 'wpSync',
      user_id: comment.userId,
    },
  });
}

/**
 * Send event action to platform.js(vuukle-initialization) so it will handle it and send event to server
 * @param  {string} action - action name
 * @return {void}
 */
export const reportEvent = (
  action:
    | 'share_facebook'
    | 'share_twitter'
    | 'share_pinterest'
    | 'share_linkedin'
    | 'login_facebook'
    | 'login_google'
    | 'login_twitter'
    | 'login_disqus'
    | 'view_page'
    | 'view_comments'
    | 'profile_modal'
    | 'comments_loadmore'
    | 'comments_share_twitter'
    | 'comments_share_facebook'
    | 'comments_share_email'
    | 'comments_share_link'
    | 'notifications_readall'
    | 'notifications_seeall'
    | 'notifications_refresh'
    | 'search'
    | 'load_modal'
) => windowProxy.post({ reportEvent: { action, label: 'Comments' } });

/**
 * Call SSO parent window method
 * @return {void}
 */
export const callSSOMethod = (): void => windowProxy.post({ callSSO: true });

/** Sync recommendations votes with other widgets */
export const syncRecommendations = (voted: boolean, votes: number): void =>
  windowProxy.post({ syncWidget: { voted, votes } });

// export const shareLoginTypes = (loginTypes: string[]): void => windowProxy.post({ modalData: { loginTypes } });

/** 🕐 Realtime Communication ⬇ */
export enum RealtimeMessageTypes {
  Ping = 'ping',
  Start = 'start',
  StartWriting = 'startWriting',
  StopWriting = 'stopWriting',
  IsWriting = 'isWriting',
  SetCommentCount = 'setCommentCount',
  CommentPosted = 'commentPosted',
  StartCommentsReading = 'startReadingComments',
  StopCommentsReading = 'stopReadingComments',
}

/** A message to websocket can have multiple parameters */
interface IRealtimeMessage {
  /** The request for ddata */
  type: RealtimeMessageTypes;
  /** Total comment count */
  commentCount?: number;
  /** ID of a comment, usually used for isWriting */
  commentId?: number | null;
  /** Number of replies to a comment */
  replyCount?: number;
};

/**
 * Sends message to the platform.js so it can send message to webscocket, because
 * websocket connection is initialized inside platform, not here
 *
 * @param realtimeMessage - type and addtional info to send to websocket
 * @param {RealtimeMessageTypes} realtimeMessage.type - type of the realtime message to be sent
 * @param {number} [realtimeMessage.commentCount] - Requred to be posted along with {@see RealtimeMessageTypes.SetCommentCount}
 * @return {void}
 */
export const postRealtimeMessage = (realtimeMessage: IRealtimeMessage) => {
  windowProxy.post({ realtimeMessage });
};

/**
 * Perform a search by keyword/hashtag
 * @param searchKeyword - Keyword to search by
 */
export const commentSearch = (searchKeyword: string): void => modalMessage('search', { searchKeyword });

/**
 * Perform a search by article
 * @param searchKeyword - Search keyword
 */
export const articleSearch = (searchKeyword: string): void => modalMessage('searchArticle', { searchKeyword });

/**
 * Open a verify email window
 * @param email The email to verify
 */
export const verifyEmail = (): void => modalMessage('verifyEmail');

/**
 * Add comments to powerbar counters. Used to increase the count when realtime counts arrive
 * @param newComments - number of comments to add by
 */
export const addCommentsToPowerbarCounters = (newComments: number): void => windowProxy.post({
  syncWidget: { addCommentsToCounter: newComments },
});

/**
 * When 'load new messages' is pressed, notify platform about it
 */
export const notifyPlatformOfLoadMore = (): void => windowProxy.post({
  realtimeCommentsLoaded: true,
});

/** When "{n} new replies" is pressed, send that count to platform */
export const communicateNewReplyCount = (replies: number): void => windowProxy.post({
  realtimeRepliesLoaded: replies,
});

export const notifyPlatformOfLoadModal = (): void => windowProxy.post({
  loadModal: true,
  loginTypes: authStore.loginTypes,
});
export const notifyPlatformCommentInputBoxRect = (commentInputBoxRect: ClientRect | DOMRect) => windowProxy.post({ commentInputBoxRect })

/** Platform will save this in anonymous_token which will have sameSite of 'lax' */
export const tellPlatformToSaveAnonCookie = (anonToken: string) => windowProxy.post({ anonToken });

/** Platform will remove the samesite anonymous_token cookie on request */
export const tellPlatformToRemoveAnonCookie = () => windowProxy.post({ removeAnonToken: true });
