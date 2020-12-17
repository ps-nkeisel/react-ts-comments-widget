import { makeRequest } from '@vuukle/utils';
import { hashCode } from 'utils';
import Request from 'utils/req';
import PerspectiveAPI from './PerspectiveAPI';

import userStore from 'stores/userStore';
import widgetStore from 'stores/widgetStore';
import commentsStore from 'modules/CommentList/store';
import articlesStore from 'modules/RecommendedArticles/store';

export const commentsApis = {
  /**
   * Use it for load more or when comments sorting changed
   * @param {string} sortBy - Order in which to load comments
   * @param {number | undefined} start - from which comment to start loading
   * Needed to get next page of comments. If falsy then 1st page will be loaded.
   */
  get: new Request('GET', `${process.env.API_URL}/api/v1/Comments/getCommentFeedBySort`, false, undefined, {
    apiKey: widgetStore.apiKey,
    articleId: widgetStore.article.id,
    host: widgetStore.article.host,
    pageSize: 25,
    sortBy: commentsStore.sortBy, // default value
    start: 0,
  }),
  /**
   * Use it to load one comment by ID
   * @param commentId - ID of the comment to get details
   */
  getByID: (commentId: number): Promise<any> =>
    makeRequest('GET', `${process.env.API_URL}/api/v1/Comments/loadFullComment`, {
      commentId,
    }),
  /**
   * Load all replies of a given parent comment id
   */
  loadReplies: (commentId: number): Promise<any> =>
    makeRequest('GET', `${process.env.API_URL}/api/v1/Comments/loadFullReplies`, {
      commentId,
    }),
  /**
   * Initial Load API request. To minimize requests count we will load most info in one request.
   * This API loads recommendations, comments, recommend button clicks etc, so we get almost everything needed
   * for initial rendering
   */
  /**
   * from Moustafa:
   * > For Vasily:
   * > For realtime typing when you get notifications of new comments,
   * > If the `sortedBy` field in `loadVuukle` request is set to `latest` you call loadVuukle again and it will show new comments
   * > Else, you call `getCommentFeedBySort` normally as you do now..
   */
  loadVuukle: (pageSize: number) =>
    makeRequest(
      'GET',
      `${process.env.API_URL}/api/v1/Comments/loadVuukle`,
      {
        apiKey: widgetStore.apiKey,
        articleId: widgetStore.article.id,
        globalRecommendation: articlesStore.global,
        host: widgetStore.article.host,
        pageSize,
        uri: widgetStore.article.url,
      },
      'application/json',
      userStore.token
    ),

  initialLoading: () =>
    makeRequest(
      'GET',
      `${process.env.API_URL}/api/v1/Comments/loadVuukle`,
      {
        apiKey: widgetStore.apiKey,
        articleId: widgetStore.article.id,
        globalRecommendation: articlesStore.global,
        host: widgetStore.article.host,
        pageSize: commentsStore.toLoad,
        start: 0,
        uri: widgetStore.article.url,
      },
      'application/json',
      userStore.token
    ),
  post: (
    commentText: string,
    toxicity: number,
    spam: number,
    parentId: number = 0,
    parentTimestamp: number = 0,
    lang: string = 'en',
    state?: number
  ): Promise<any> =>
    makeRequest(
      'POST',
      `${process.env.API_URL}/api/v1/Comments/post`,
      {
        comment: {
          state,
          commentText,
          parentId,
          parentTimestamp,
          spamValue: Math.round(spam),
          toxicity: Math.round(toxicity),

          apiKey: widgetStore.apiKey,
          articleAvatar: widgetStore.article.img,
          articleId: widgetStore.article.id,
          host: widgetStore.article.host,
          lang,
          tag: widgetStore.article.tags,
          title: widgetStore.article.title,
          uri: widgetStore.article.url,
        },
        r: hashCode(commentText),
        s: hashCode(commentText + widgetStore.apiKey),
      },
      undefined,
      userStore.token
    ).then((response): any => {
      if (!response.success) {
        throw new Error(Array.isArray(response.errors) ? response.errors[0] || 'unknown' : 'unknown');
      }
      return response;
    }),

  edit: (commentId: number, commentText: string): Promise<any> =>
    makeRequest(
      'POST',
      `${process.env.API_URL}/api/v1/Comments/editComment`,
      {
        commentId,
        commentText,

        apiKey: widgetStore.apiKey,
        host: widgetStore.article.host,
        r: hashCode(commentText),
        s: hashCode(commentText + widgetStore.apiKey),
      },
      undefined,
      userStore.token
    ).then((response): any => {
      if (!response.success) {
        throw new Error(Array.isArray(response.errors) ? response.errors[0] || 'unknown' : 'unknown');
      }
      return response;
    }),

  changeStatus: (id: number) =>
    makeRequest(
      'POST',
      `${process.env.API_URL}/api/v1/Comments/setCommentStatus`,
      {
        commentIDs: [id],
        state: 1,
      },
      'application/json',
      userStore.token
    ),

  delete: (id: number) =>
    makeRequest(
      'POST',
      `${process.env.API_URL}/api/v1/Comments/removeCommentByUser`,
      {
        commentIDs: [id],
        state: 1,
      },
      'application/json',
      userStore.token
    ),
};

export const perspectiveAPIs = {
  spamModel: new PerspectiveAPI('SPAM'),
  toxicModel: new PerspectiveAPI('TOXICITY'),
};

export const commentVotesAPIs = {
  /**
   * Removes comment likes or dislikes
   *
   * @param {number} commentId - ID of a comment to remove vote for
   * @param {(0 | 1)} action - 0 to remove like, and 1 to remove dislikes
   */
  delete: (commentId: number, action: number = 0) =>
    makeRequest(
      'DELETE',
      `${process.env.API_URL}/api/v1/comment_likes`,
      {
        action,
        apiKey: widgetStore.apiKey,
        articleAvatar: widgetStore.article.img,
        articleId: widgetStore.article.id,
        commentId,
        host: widgetStore.article.host,
        tag: widgetStore.article.tags,
        title: widgetStore.article.title,
        uri: widgetStore.article.url,
      },
      'application/json',
      userStore.token,
      true
    ),
  getUserVotesByArticle: (userId: string) =>
    makeRequest(
      'GET',
      `${process.env.API_URL}/api/v1/comment_likes/getUserCommentActionsByArticle`,
      {
        articleId: widgetStore.article.id,
        host: widgetStore.article.host,
        userId,
      },
      'application/json',
      userStore.token,
      true
    ),
  post: (commentId: number, action: number = 0) =>
    makeRequest(
      'POST',
      `${process.env.API_URL}/api/v1/comment_likes`,
      {
        action,
        apiKey: widgetStore.apiKey,
        articleAvatar: widgetStore.article.img,
        articleId: widgetStore.article.id,
        commentId,
        host: widgetStore.article.host,
        tag: widgetStore.article.tags,
        title: widgetStore.article.title,
        uri: widgetStore.article.url,
      },
      'application/json',
      userStore.token,
      true
    ),
};

export const commentFlagAPIs = {
  post: (commentId: number) =>
    makeRequest(
      'POST',
      `${process.env.API_URL}/api/v1/comment_flags/setCommentFlag`,
      {
        apiKey: widgetStore.apiKey,
        articleId: widgetStore.article.id,
        commentId,
        host: widgetStore.article.host,
      },
      'application/json',
      userStore.token
    ),
};

export const blockUserAPIs = {
  post: (userId: string) =>
    makeRequest(
      'POST',
      `${process.env.API_URL}/api/v1/BlockedUsers/block`,
      {
        host: widgetStore.article.host,
        userId,
      },
      'application/json',
      userStore.token
    ),
};

export const userActionsAPIs = {
  get: (userId: string) =>
    makeRequest(
      'GET',
      `${process.env.API_URL}/api/v1/Users/getUserActions`,
      {
        userId,
      },
      'application/json',
      userStore.token
    ),
};

export const notificationAPIs = {
  /**
   * @description Get the latest notifications for the userId
   * @param {string} userId The ID of the user to get latest notifications for
   * @param {number} limit How many notifications to fetch
   */
  getLatestNotifications: (userId: string, limit: number) =>
    makeRequest(
      'GET',
      `${process.env.API_URL}/api/v1/Notifications/latest`,
      { userId, limit },
      'application/json',
      userStore.token
    ),
  /**
   * @description Get the number of unread notifications for the userId
   * @param {string} userId The ID of the user to get notifications count for
   */
  getNotificationCount: (userId: string) =>
    makeRequest('GET', `${process.env.API_URL}/api/v1/Notifications`, { userId }, 'application/json', userStore.token),
  /**
   * @description Mark a notification(s) as read
   * @param {number} notificationId The id(s) of notification(s) to be marked as read
   */
  markNotificationsAsRead: (notificationId: number | number[]) =>
    makeRequest(
      'POST',
      `${process.env.API_URL}/api/v1/Notifications/markAsRead?notificationIds=${
        !Array.isArray(notificationId) ? notificationId : notificationId.join(',')
      }`,
      {},
      'application/json',
      userStore.token
    ),
};

export const mentionsApis = {
  get: (name: string) =>
    makeRequest(
      'GET',
      `${process.env.API_URL}/api/v1/Comments/mentionUser`,
      {
        articleId: widgetStore.article.id,
        host: widgetStore.article.host,
        name,
      },
      'application/json',
      userStore.token
    ).then((response) => (response.success ? response.data : [])),
};

export const followerAPIs = {
  /** Follow a user given their userId */
  follow: (userId: string) =>
    makeRequest(
      'POST',
      `${process.env.API_URL}/api/v1/Followers/followUser`,
      `${userId}`,
      'application/json',
      userStore.token
    ),
  /** Get the list of user who follow the current authorized user */
  getCurrentFollowers: () =>
    makeRequest(
      'GET',
      `${process.env.API_URL}/api/v1/Followers/getMyFollowers`,
      undefined,
      'application/json',
      userStore.token
    ),
  /** Get the follower count of the given userId */
  getFollowerCount: (userId: string) =>
    makeRequest(
      'GET',
      `${process.env.API_URL}/api/v1/Followers/getFollowerCount`,
      { userId },
      'application/json',
      userStore.token
    ),
  /** Get the list of users that the current authorized user follows */
  getUserFollows: () =>
    makeRequest(
      'GET',
      `${process.env.API_URL}/api/v1/Followers/usersIFollow`,
      undefined,
      'application/json',
      userStore.token
    ),
  /** Unfollow the user with the given userId */
  unfollow: (userId: string) =>
    makeRequest(
      'DELETE',
      `${process.env.API_URL}/api/v1/Followers/unFollowUser`,
      `${userId}`,
      'application/json',
      userStore.token
    ),
};

export const articlesAPIs = {
  /** Only 10 articles at once can be fetched from this API */
  getPopularArticlesByHost: (host: string, start: number = 0) =>
    makeRequest(
      'GET',
      `${process.env.API_URL}/api/v1/Articles/getPopularArticlesByHost`,
      {
        host,
        pageSize: 10,
        start,
      },
      'application/json',
      undefined
    ),
};

export const verificationAPIs = {
  sendVerificationEmail: () =>
    makeRequest(
      'POST',
      `${process.env.API_URL}/api/v1/Auth/sendVerificationCodeToEmail`,
      undefined,
      'application/json',
      userStore.token
    ),
};

export default {
  commentsApis,
};
