import * as React from 'react';

/* ========================================================
 * 📦 Store
======================================================== */
import { Provider } from 'mobx-react';

import commentsStore, { SortingType } from 'modules/CommentList/store';
import notificationStore from 'modules/Notifications/store';
import articlesStore from 'modules/RecommendedArticles/store';
import CookiesSession from 'services/cookiesSession';
import authStore from 'stores/authStore';
import widgetStore from 'stores/widgetStore';

import SearchInput from 'components/SearchInput';

import { generateRandomEmail, generateRandomName } from 'utils/random';

// Create Stores object to pass to store Provider
const stores = {
  authStore,
  commentsStore,
  notificationStore,
  userStore,
  widgetStore,
};

/* ========================================================
 * 1️⃣ Initial Load
 * We call one API on initial load that returns everything needed
 * for the first rendering (recommends, article data, comments...)
======================================================== */
import { commentsApis } from 'services/apis';
import { syncInitialLoadPorthole, authenticateUser, notifyPlatformCommentInputBoxRect } from 'services/communication';

commentsApis.initialLoading().then(async (response: any) => {
  /** Server didn't load article and didn't return error */
  if (!response.success || !(response.data instanceof Object)) {
    return;
  }
  const isGuestOnlyAuth: boolean =
    response.data.loginTypes.indexOf('guest') > -1 && response.data.loginTypes.indexOf('password') === -1;
  // Set the available login types for comments widget
  authStore.setLoginTypes(response.data.loginTypes);
  // Make CookiesSession service aware if the host uses SSO or not. It uses different cookies for SSO hosts
  CookiesSession.setSSOInfo(response.data.loginTypes.indexOf('sso') > -1);
  // Go through SSO auth action if neccessary
  if (userStore.awaitsAuth && !widgetStore.anonymousCommenting) {
    authenticateUser(authStore.tempAuthData);
  } else if (
    isGuestOnlyAuth &&
    widgetStore.anonymousCommenting &&
    !CookiesSession.isRegularTokenPresent() &&
    !CookiesSession.isAnonymousTokenPresent()
  ) {
    const randomEmail = generateRandomEmail();
    const randomName = generateRandomName();
    userStore.createMakeshiftSession(randomName, randomEmail);
  } else {
    // Authorize user regularly if possible.
    userStore.awaitsAuth = true;
    const guestLogin: boolean = response.data.loginTypes.indexOf('guest') > -1;
    const passwordLogin: boolean = response.data.loginTypes.indexOf('password') > -1;
    const anonCommenting: boolean = widgetStore.anonymousCommenting;
    const guestOnlyButNoAnon: boolean = isGuestOnlyAuth && !CookiesSession.isRegularTokenPresent() && !anonCommenting;
    const guestAndPasswordButNoToken: boolean = guestLogin && passwordLogin && !CookiesSession.isRegularTokenPresent();

    if (guestOnlyButNoAnon || guestAndPasswordButNoToken) {
      CookiesSession.setRegularCommenting(false);
      userStore.isGuest = true;
      CookiesSession.setGuestCommenting(true);
    }

    if (anonCommenting) {
      CookiesSession.setRegularCommenting(false);
      CookiesSession.setGuestCommenting(false);
    }

    await userStore.authorizeSilently();
  }
  // Update Comments store with the comments list and total comments count
  await commentsStore.initialLoadSuccess(response.data.comments.items, response.data.article.commentCount);
  // Update recommended articles store (ToT section)
  articlesStore.setArticlesFromServer(response.data.recommended || [], response.data.defaultTotCount);
  // Populate the likes and dislikes of the user in userStore
  userStore.initializeVotes(response.data.commentActions);
  // If server returned that article commenting is disabled update our store
  widgetStore.commentingDisabled = response.data.article.disabled || false;
  // Fetch notification count if the user is logged in
  if (userStore.details && !notificationStore.loadingCount && !userStore.isAnonymous) {
    await notificationStore.getNotificationCount(userStore.details.id);
  }
  // Share data with outer widgets
  syncInitialLoadPorthole(response);

  // We store comments sorting inside local store so on reload sorting order can be saved
  const serverSorting = SortingType[response.data.sortedBy];
  if (authStore.isCookiesAllowed) {
    const commentsStorage = JSON.parse(localStorage.getItem('commentsStore') || '{}');
    if (commentsStorage && commentsStorage._sortBy) {
      commentsStore.changeSorting(commentsStorage._sortBy);
      if (commentsStorage._sortBy !== serverSorting) {
        commentsStore.loadComments();
      }
    } else {
      commentsStore.changeSorting(serverSorting, true);
    }
  }

  commentsStore.initialLoadingComplete = true;
});

/* ========================================================
 * 🌅 Main APP Container
======================================================== */
import CommentsList from 'modules/CommentList';
import Layout from 'modules/Layout';
import Articles from 'modules/RecommendedArticles';
import WriteComment from 'modules/WriteComment';
import userStore from 'stores/userStore';

import ReactDOM from 'react-dom';

const App: React.FC = () => {
  const commentInputBoxRef: React.RefObject<any> = React.useRef();
  const [commentInputBoxRect, setCommentInputBoxRect] = React.useState<DOMRect | undefined>(undefined);
  const [timerID, setTimerID] = React.useState<any>(0);

  React.useEffect(() => {
    if (widgetStore.realtime && typeof DOMRect !== 'undefined') {
      /**
       * This timer will report the dimensions of the comment input box to platform
       * Which the blue 'new message' bar can use to toggle it's own visibility
       */
      if (!widgetStore.widgetHidden) {
        setTimerID(
          setInterval(() => {
            const el = ReactDOM.findDOMNode(commentInputBoxRef.current) as HTMLElement;
            const rect = el.getBoundingClientRect();
            const newCommentInputBoxRect = new DOMRect(el.offsetLeft, el.offsetTop, rect.width, rect.height);
            if (
              !commentInputBoxRect ||
              newCommentInputBoxRect.top !== commentInputBoxRect.top ||
              newCommentInputBoxRect.height !== commentInputBoxRect.height
            ) {
              setCommentInputBoxRect(newCommentInputBoxRect);
              notifyPlatformCommentInputBoxRect(newCommentInputBoxRect);
            }
          }, 5000)
        );
      }
    }
    return () => {
      if (widgetStore.realtime && typeof DOMRect !== 'undefined' && timerID) {
        clearInterval(timerID);
      }
    }
  }, [] );

  return (
    <Provider {...stores}>
      <Layout>
        <div ref={commentInputBoxRef}>
          <WriteComment addComment={commentsStore.addComment} parentId={0} />
          <SearchInput />
        </div>
        <CommentsList />
        <Articles />
      </Layout>
    </Provider>
  );
}

export default App;
