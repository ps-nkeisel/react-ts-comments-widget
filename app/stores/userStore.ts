import { makeDevLog } from '@vuukle/utils';
import { action, computed, decorate, observable } from 'mobx';
import get from 'lodash/get';

import notificationStore from 'modules/Notifications/store';
import { blockUserAPIs, commentVotesAPIs, followerAPIs } from 'services/apis';
import cookiesSession from 'services/cookiesSession';
import { translation } from 'services/translation';
import widgetStore from 'stores/widgetStore';
import { authAPIs, CancellationReasons } from 'modules/Auth/API';
import Cookies from 'js-cookie';
import { tellPlatformToRemoveAnonCookie } from 'services/communication';

export class UserStore {
  /** Determines if user details are loading */
  public loading: boolean = false;
  /** User details we receive from server */
  public details: User | null = null;
  /**
   * User can block other users.
   * In this list we keep IDs of users that the current user blocked,
   * so we can hide a content of comments that blocked users made.
   */
  public blockedIDs: string[] = [];
  /**
   * User session token.
   * We need to save token not only in the cookies but here too, because some browsers block
   * 3rd party cookies (from iframe) and we can't be sure that created cookie will be available to use, but
   * we can't provide session for user with duration for at lest before page reloading
   * @default null
   */
  @observable
  private _token: string | null = null;
  /** Comment IDs that were liked by the user */
  @observable
  public likes: number[] = [];
  /** Comment IDs that were disliked by the user */
  @observable
  public dislikes: number[] = [];
  /** User IDs that are followed by the authorized user */
  @observable
  public followedUsers: string[] = [];
  /**
   *  Used in case platform returns a 'authenticateUser' through porthole
   *  Which means auth action was completed through SSO
   */
  @observable
  public awaitsAuth: boolean = false;
  /**
   * IDs of the comments user has posted in this session so far
   */
  @observable
  public postedCommentIDs: number[] = [];
  /**
   * Indicates that current user is a guest or not
   */
  public isGuest: boolean = false;
  /**
   * Indicates that current user is an anonymous guest
   */
  public isAnonymous: boolean = widgetStore.anonymousCommenting && !cookiesSession.isRegularTokenPresent();

  /** Token getter */
  public get token(): string | null {
    if (!this.awaitsAuth && !this.details) {
      return null;
    }

    const cookieToken = cookiesSession.getToken();

    if (typeof cookieToken === 'string') {
      if (typeof this._token === 'string' && cookieToken !== this._token) {
        this._token = cookieToken;
      } else if (!this._token) {
        this._token = cookieToken;
      }
    }

    return this._token;
  }

  /** Token setter */
  public set token(token: string | null) {
    if (!token) {
      cookiesSession.removeToken();
      this._token = null;
    } else {
      cookiesSession.saveToken(token);
      this._token = token;
    }
  }

  /**
   * @description Determines if user is authorized
   * @return {boolean}
   */
  get isAuthorized(): boolean {
    return !!(this.details && this.details.id && this.details.email);
  }

  /**
   * @public
   * @description Get user details by token
   * @return {Promise<void>>}
   */
  public authorizeWithToken = async (token?: string): Promise<boolean> => {
    this.loading = true;

    try {
      const response = await authAPIs.me.send(token || this.token);
      const authResponse = response.data;

      if (
        authResponse.success &&
        typeof get(authResponse, ['data', 'email']) === 'string' &&
        typeof get(authResponse, ['data', 'name']) === 'string'
      ) {
        this.details = {
          avatar: authResponse.data.pictureUrl || null,
          email: authResponse.data.email,
          emailVerified: authResponse.data.user.isEmailVerified,
          id: authResponse.data.userId,
          isModerator: authResponse.data.siteList.indexOf(widgetStore.article.host) > -1,
          isPasswordEntered: authResponse.data.isPasswordEntered,
          name: authResponse.data.name,
          points: authResponse.data.points,
        };
        this.blockedIDs = authResponse.data.blockedUserIds;

        if (authResponse.data.isPasswordEntered) {
          cookiesSession.setGuestCommenting(false);
          cookiesSession.setRegularCommenting(true);
          this.isGuest = false;
          this.isAnonymous = false;
        }

        /** Degrade regular session down to guest session if the user is a guest */
        const currentToken = Cookies.get('token');
        if (authResponse.data.isPasswordEntered === false && currentToken) {
          Cookies.remove('token', cookiesSession.defaultCookieOptions);
          if (!this.isAnonymous || !widgetStore.anonymousCommenting) {
            cookiesSession.setGuestCommenting(true);
            this.token = currentToken;
            this.isGuest = true;
          } else {
            Cookies.set('guest_token', currentToken, cookiesSession.defaultCookieOptions);
          }
        }

        cookiesSession.saveUserAPIKey(this.details.id); // save user API key in cookies for analytics usage
        this.getUserVotes(this.details.id);
        if (!widgetStore.anonymousCommenting) {
          this.getFollowedUsers();
          notificationStore.getNotificationCount(this.details.id);
        }

        return true;
      }

      throw new Error(`[api/v1/Auth/me]. Response: ${JSON.stringify(authResponse)}. Token: ${this.token}`);
    } catch (err) {
      if (err.message === CancellationReasons.LOGOUT) {
        throw new Error(err);
      } else {
        this.forgetUser();
        throw new Error(translation.messages.invalidLogin);
      }
    } finally {
      this.loading = false;
      this.awaitsAuth = false;
    }
  };

  /**
   * Fetch user votes from the API
   */
  public getUserVotes = async (userId: string) => {
    try {
      const response = await commentVotesAPIs.getUserVotesByArticle(userId);
      if (response.success) {
        this.initializeVotes(response.data);
      }
    } catch (err) {
      this.likes = [];
      this.dislikes = [];
    }
  };

  /**
   * @public
   * @description clear user session
   * @return {void}
   */
  public forgetUser = (): void => {
    cookiesSession.removeUserAPIKey();
    notificationStore.clearNotifications();
    authAPIs.me.cancel(CancellationReasons.LOGOUT);
    if (widgetStore.anonymousCommenting) {
      tellPlatformToRemoveAnonCookie();
    }
    this.token = null;
    this.details = null;
    this.likes = [];
    this.dislikes = [];
    this.followedUsers = [];
    this.blockedIDs = [];
  };

  /**
   * @public
   * @description Populates the list of user's likes and dislikes
   * @param {Comments.UserAction[]} votes API array of objects containing the user's likes and dislikes with their comment IDs
   * @return {void}
   */
  public initializeVotes = (votes: Comments.UserAction[]): void => {
    votes.forEach((vote: Comments.UserAction) => {
      if (vote.action === 0) {
        if (vote.commentId) {
          this.likes.push(vote.commentId);
        }

        if (vote.comment) {
          this.likes.push(vote.comment.id);
        }
      }

      if (vote.action === 1) {
        if (vote.commentId) {
          this.dislikes.push(vote.commentId);
        }

        if (vote.comment) {
          this.dislikes.push(vote.comment.id);
        }
      }
    });
  };

  /**
   * @public
   * @name authorizeSilently
   * @description Silent authorization method to do in background if token exists in cookies.
   * For example when we detected use token on page load
   * @return {void}
   */
  public authorizeSilently = async (token?: string): Promise<boolean> => {
    if (token || this.token) {
      try {
        await this.authorizeWithToken(token);
        return true;
      } catch (e) {
        return false;
      }
    } else {
      return false;
    }
  };

  /**
   * @public
   * @name blockUser
   * @description Calls API to block user, on success also ADs ID to blockedIDs array and returns true,
   * otherwise throws an Error
   * @throws Error
   * @return <Promise<boolean | Error>>
   */
  public blockUser = async (id: string): Promise<boolean | Error> => {
    try {
      const response = await blockUserAPIs.post(id);
      makeDevLog('log', 'response ', response);
      if (response.success) {
        this.blockedIDs.push(id);
        return true;
      } else {
        throw new Error(Array.isArray(response.errors) ? response.errors : 'unknown');
      }
    } catch (err) {
      throw new Error(err.message);
    }
  };

  /** Check if that user is being followed by the current user */
  public isFollowing = (userId: string) => {
    return this.followedUsers.indexOf(userId) > -1;
  };

  /** Add a user to followed users list */
  public addToFollowed = (userId: string) => {
    this.followedUsers.push(userId);
  };

  /** Remove a user from followed users list */
  public removeFromFollowed = (userId: string) => {
    this.followedUsers = this.followedUsers.filter((id) => id !== userId);
  };

  /**
   * Get the list of users that current authorized user follows
   */
  public getFollowedUsers = async () => {
    try {
      const response = await followerAPIs.getUserFollows();
      if (response.success) {
        response.data.forEach((user: any) => {
          // apiKey is user's id
          this.addToFollowed(user.apiKey);
        });
      }
    } catch (err) {
      this.followedUsers = [];
    }
  };

  public makeEmailVerified = () => {
    if (this.details) {
      this.details.emailVerified = true;
    }
  }

  /** Create fake anonymous user details object */
  public createMakeshiftSession = (name: string, email: string) => {
    this.details = {
      avatar: null,
      email,
      emailVerified: true,
      id: '111111111111111111',
      isModerator: false,
      isPasswordEntered: false,
      name,
      points: 0,
    };
    this.isAnonymous = true;
  }
}

decorate(UserStore, {
  authorizeSilently: action,
  authorizeWithToken: action,
  blockedIDs: observable,
  details: observable,
  forgetUser: action,
  isAuthorized: computed,
  loading: observable,
  isAnonymous: observable,
  isGuest: observable,
  makeEmailVerified: action,
  createMakeshiftSession: action,
});

export default new UserStore();
