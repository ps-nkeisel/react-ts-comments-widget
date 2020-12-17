/**
 * @file Initialize widget communication listener.
 * Many of the messages can change our state, so we import states here and change them as it's easier to setup just
 * one listener and control everything within it
 */
import { makeDevLog } from '@vuukle/utils';
import get from 'lodash/get';
import { followerAPIs } from 'services/apis';
import { windowProxy } from 'services/communication';
import { translation } from 'services/translation';

import authStore from 'stores/authStore';
import userStore from 'stores/userStore';

import commentsStore from 'modules/CommentList/store';
import articlesStore from 'modules/RecommendedArticles/store';
import RealtimeStorage from 'modules/RealtimeTyping/store';
import { commentSearch, reportEvent } from './sendEvents';
import cookiesSession from 'services/cookiesSession';
import widgetStore from 'stores/widgetStore';

export async function initializeListener() {
  windowProxy.addEventListener(async (event: any) => {
    if (!(event.data instanceof Object)) {
      return; // Message is invalid
    }

    if (
      get(event, ['data', 'anonToken']) &&
      widgetStore.anonymousCommenting &&
      !cookiesSession.isRegularTokenPresent() &&
      !cookiesSession.isAnonymousTokenPresent() &&
      !authStore.isCookiesAllowed &&
      widgetStore.hasAnonFallback
    ) {
      /** Authorize anon user */
      userStore.isGuest = false;
      userStore.isAnonymous = true;
      userStore.awaitsAuth = true;
      cookiesSession.setRegularCommenting(false);
      cookiesSession.setGuestCommenting(false);
      userStore.token = event.data.anonToken;
      await userStore.authorizeWithToken();
    }

    makeDevLog('log', 'comments porthole event received', event);
    if (get(event, ['data', 'authenticateUser']) instanceof Object && !widgetStore.anonymousCommenting) {
      // This is done so that the users in SSO sites that don't have tokens in the first place can sign in later
      // without breaking the isolated tokens and the rule for 'get backend login types first - auth actions later'
      if (commentsStore.initialLoadingComplete === true) {
        await authenticateUser(event.data.authenticateUser);
      }
      userStore.awaitsAuth = true;
      authStore.tempAuthData = event.data.authenticateUser;
    } else if (get(event, ['data', 'modalData'])) {
      /** modalData usually comes after user exits modal's auth page */
      await handleModalData(event.data.modalData);
    } else if (get(event, ['data', 'followInfo'])) {
      const { action, userId } = event.data.followInfo;
      /** If someone is unfollowed or followed from modal */
      if (action === 'follow' && !userStore.isFollowing(event.data.followInfo)) {
        const response = await followerAPIs.follow(event.data.followInfo);
        if (response.success) {
          userStore.addToFollowed(userId);
        }
      } else if (action === 'unfollow') {
        const response = await followerAPIs.unfollow(event.data.followInfo);
        if (response.success) {
          userStore.removeFromFollowed(userId);
        }
      }
    } else if (get(event, ['data', 'loadComment'])) {
      // Set the highlighted comment ID in comment store
      commentsStore.getCommentDetailsByID(Number(event.data.loadComment));
    } else if (get(event, ['data', 'cardStyles'])) {
      articlesStore.customCardStyles = event.data.cardStyles;
    } else if (get(event, ['data', 'loadNewRealtime'])) {
      // Update with new comments when the notification bar is pressed
      commentsStore.loadNewComments(RealtimeStorage.newCommentsCount);
    } else if (get(event, ['data', 'modalLoaded'])) {
      widgetStore.modalLoaded = event.data.modalLoaded;
    } else if (get(event, ['data', 'modalMessage'])) {
      if (event.data.modalMessage.verifiedEmail && userStore.isAuthorized) {
        userStore.makeEmailVerified();
      }
    }
  });
}

/** Authenticate user based on received message */
export async function authenticateUser(authenticationObject: any) {
  const { name, email, avatar, token, signOut } = authenticationObject;

  // Sign out user if called with signOut key
  if (signOut) {
    return authStore.signOut();
  }
  if (
    typeof name === 'string' &&
    typeof email === 'string' &&
    name.length > 2 &&
    email.length > 3 &&
    !userStore.isAuthorized
  ) {
    // Authenticate user with name and email
    userStore.awaitsAuth = true;
    await authStore.signInWithoutPassword(email, name, avatar);
  } else if (typeof token === 'string') {
    // Authenticate user with token
    userStore.awaitsAuth = true;
    userStore.isGuest = false;
    userStore.isAnonymous = false;
    cookiesSession.setGuestCommenting(false);
    cookiesSession.setRegularCommenting(true);
    userStore.token = token;
    await userStore.authorizeWithToken();
  }

  userStore.awaitsAuth = false;
  authStore.tempAuthData = null;
}

/** Handle responses that modal sends back to comment */
async function handleModalData(modalData: any) {
  if (modalData.auth) {
    /** Modal Authorization */
    await userStore.authorizeSilently(cookiesSession.getToken() || '');
  }

  // if a user was blocked by a guest that just authorized
  if (modalData.blockUser) {
    if (userStore.isAuthorized) {
      userStore.blockUser(modalData.blockUser);
    }
  }

  // if a comment was being reported by a guest that just authorized
  if (modalData.reportComment) {
    if (userStore.isAuthorized) {
      const comment = commentsStore.comments.find((comm) => comm.data.id === modalData.reportComment);
      if (comment) {
        comment.report();
      }
    }
  }

  // if a comment was being liked by a guest that just authorized
  if (modalData.likeComment) {
    if (userStore.isAuthorized) {
      const comment = commentsStore.comments.find((comm) => comm.data.id === modalData.likeComment);
      if (comment) {
        comment.toggleLike();
      }
    }
  }

  // if a comment was being disliked by a guest that just authorized
  if (modalData.dislikeComment) {
    if (userStore.isAuthorized) {
      const comment = commentsStore.comments.find((comm) => comm.data.id === modalData.dislikeComment);
      if (comment) {
        comment.toggleDownvote();
      }
    }
  }

  // Modal sends hash clear when a search modal is closed
  // This is done so that the same hashtag can be clicked over and over
  if (modalData.clearHash) {
    window.location.hash = '';
  }

  // if a user was followed by a guest that just authorized
  if (modalData.followUser || (modalData.followInfo && modalData.followInfo.action === 'follow')) {
    // if the follow button was clicked from modal, we will use the separate 'user' and 'commentId' variables
    const user = modalData.followInfo && modalData.followInfo.userId;
    const commentId = modalData.followInfo && modalData.followInfo.commentId;
    // if user is authorized and is not following that user that they're trying to follow
    if (userStore.isAuthorized && !userStore.isFollowing(user ? user : modalData.followUser)) {
      const response = await followerAPIs.follow(user ? user : modalData.followUser);
      if (response.success) {
        userStore.addToFollowed(user ? user : modalData.followUser);
        const comment = commentsStore.comments.find(
          (comm) => comm.data.id === (commentId ? commentId : modalData.fromComment)
        );
        if (comment) {
          comment.bottomAlert.value = {
            message: `${translation.messages.youAreFollowing} ${comment.data.name}!`,
            type: 'success',
          };
        }
      }
    }
  }
}

/**
 * Track iframe URL hash changes
 * Event is used for responding to hashtag clicks that happen in comments
 */
window.onhashchange = (e: HashChangeEvent) => {
  // Take the hash
  const hash: string | null = e.target && (e.target as Window).location.hash;
  if (hash) {
    // Make sure the hash change does match the way hashtags are created
    const match: RegExpMatchArray | null = hash.match(/\#hash-(.+)/);
    if (match) {
      // If a match was found, use the captured value with a '#' and open the modal with search results
      commentSearch(decodeURIComponent('#' + match[1]));
      reportEvent('search');
    }
  }
};
