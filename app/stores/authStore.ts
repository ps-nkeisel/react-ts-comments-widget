import { isOffensive, isValidEmail, isValidName } from '@vuukle/utils';
import { action, decorate, observable } from 'mobx';

import { callSSOMethod, reportEvent, tellPlatformToSaveAnonCookie } from 'services/communication';
import { translation } from 'services/translation';
import { authAPIs } from 'modules/Auth/API';
import userStore from './userStore';

import Alert from 'stores/models/Alert';
import CookiesSession from 'services/cookiesSession';

/** The login types that can be returned from loadVuukle */
enum LoginTypes {
  FACEBOOK = 'facebook',
  GOOGLE = 'google',
  TWITTER = 'twitter',
  DISQUS = 'disqus',
  /** Regular Vuukle sign-in with email and password */
  PASSWORD = 'password',
  /** Regular Vuukle sign-in with name and email */
  GUEST = 'guest',
  SSO = 'sso',
}

export class AuthStore {
  /** Determines if API is in progress and we are waiting for data */
  public inProgress: boolean = false;
  /** Used if SSO auth action was completed via 'authenticateUser' from porthole */
  public tempAuthData: any = undefined;
  /** Error happened */
  public error = new Alert();
  public loginTypes: LoginTypes[] = [];
  public alert = new Alert();
  /** Configurable values */
  public facebookEnabled: boolean = this.isLoginTypeEnabled(LoginTypes.FACEBOOK); // show fb auth
  public googleEnabled: boolean = this.isLoginTypeEnabled(LoginTypes.GOOGLE); // show google auth
  public twitterEnabled: boolean = this.isLoginTypeEnabled(LoginTypes.TWITTER); // show twitter auth
  public disqusEnabled: boolean = this.isLoginTypeEnabled(LoginTypes.DISQUS); // show disqus auth
  // when both Vuukle Guest and Vuukle Password are enabled, a hybrid auth form is shown
  public withVuukle: boolean = this.isLoginTypeEnabled(LoginTypes.GUEST); // show Vuukle guest auth
  public withPassword: boolean = this.isLoginTypeEnabled(LoginTypes.PASSWORD); // show Vuukle Password Auth + Available form to sign up
  public withSSO: boolean = this.isLoginTypeEnabled(LoginTypes.SSO); // Publisher SSO(auth method)

  constructor() {
    /** Handler for publishers using widget inside webView to authorize users */
    (window as any).signInUser = (name: any, email: any, avatar: any = '') => {
      if (
        typeof name === 'string' &&
        typeof email === 'string' &&
        name.length > 2 &&
        email.length > 3 &&
        !userStore.isAuthorized
      ) {
        this.signInWithoutPassword(name, email, avatar);
      }
    };
  }

  /**
   * @name signOut
   * @description remove user session and token
   * @see {@link userStore#forgetUser}
   * @return {void}
   */
  public signOut = userStore.forgetUser;

  /** Detect if cookies allowed */
  get isCookiesAllowed() {
    const checkCookie = (cookie: string) => {
      document.cookie = cookie;
      const cookiesAllowed = document.cookie.indexOf('vuukle_cookie_test') !== -1;
      if (cookiesAllowed) {
        document.cookie = cookie + ' expires=Thu, 01-Jan-1970 00:00:01 GMT';
        return cookiesAllowed;
      }
      return false;
    };

    return (
      checkCookie('vuukle_cookie_test=true; SameSite=None; Secure;') ||
      checkCookie('vuukle_cookie_test=true; SameSite=Lax;') ||
      checkCookie('vuukle_cookie_test=true;')
    );
  }

  public isLoginTypeEnabled(loginType: LoginTypes) {
    return this.loginTypes && this.loginTypes.indexOf(loginType) > -1;
  }

  public setLoginTypes(loginTypes: LoginTypes[]) {
    this.loginTypes = loginTypes;
    this.updateLoginTypes();
  }

  /** Update login variables */
  public updateLoginTypes() {
    this.withVuukle = this.isLoginTypeEnabled(LoginTypes.GUEST);
    this.withPassword = this.isLoginTypeEnabled(LoginTypes.PASSWORD);
    this.facebookEnabled = this.isLoginTypeEnabled(LoginTypes.FACEBOOK);
    this.googleEnabled = this.isLoginTypeEnabled(LoginTypes.GOOGLE);
    this.twitterEnabled = this.isLoginTypeEnabled(LoginTypes.TWITTER);
    this.disqusEnabled = this.isLoginTypeEnabled(LoginTypes.DISQUS);
    this.withSSO = this.isLoginTypeEnabled(LoginTypes.SSO);
  }

  /** Login user using API */
  public signIn = async (email: string, password: string): Promise<void> => {
    this.inProgress = true;

    try {
      /** Check CORS limits */
      if (!this.isCookiesAllowed) {
        await this.openCORSModal();
      }

      const response = await authAPIs.withPassword.send(email, password);
      const { isPasswordEntered, errors, token } = response.data;

      if (!isPasswordEntered || Array.isArray(errors)) {
        throw new Error(translation.messages.incorrectDetails);
      }

      userStore.awaitsAuth = true;
      CookiesSession.setGuestCommenting(false);
      CookiesSession.setRegularCommenting(true);
      userStore.token = token;
      userStore.isGuest = false;
      userStore.isAnonymous = false;
      await userStore.authorizeWithToken();
    } catch (error) {
      this.alert.value = {
        message: error.message,
        type: 'error',
      };
    } finally {
      this.inProgress = false;
    }
  };

  /** User login method without password */
  public signInWithoutPassword = async (email: string, name: string, avatar: string = ''): Promise<void> => {
    this.inProgress = true;

    name = name.trim();
    email = email.trim();

    try {
      /** Check CORS limits */
      if (!this.isCookiesAllowed) {
        if (userStore.isAnonymous) {
          await this.openCORSModal(false, true);
        } else {
          await this.openCORSModal(true, false);
        }
      }

      await this.validateFields(name, email);
      const response = await authAPIs.withoutPassword.send(name, email, avatar);
      const { authTicket } = response.data.data;

      userStore.awaitsAuth = true;
      CookiesSession.setRegularCommenting(false);
      CookiesSession.setGuestCommenting(true);
      userStore.isGuest = true;
      if (userStore.isAnonymous) {
        userStore.isGuest = false;
        CookiesSession.setGuestCommenting(false);
      }
      userStore.token = authTicket.token;
      await userStore.authorizeWithToken();
    } catch (error) {
      this.alert.value = {
        message: error.message,
        type: 'error',
      };
    } finally {
      this.inProgress = false;
    }
  };

  /** Anon sign-in option that returns the token */
  public signInAnonFallback = async (email: string, name: string) => {
    this.inProgress = true;

    try {
      const response = await authAPIs.withoutPassword.send(name, email);
      const { authTicket } = response.data.data;
      userStore.awaitsAuth = true;
      CookiesSession.setRegularCommenting(false);
      if (userStore.isAnonymous) {
        userStore.isGuest = false;
        CookiesSession.setGuestCommenting(false);
      }
      userStore.token = authTicket.token;
      tellPlatformToSaveAnonCookie(authTicket.token);
      await userStore.authorizeWithToken();
    } catch (error) {
      this.alert.value = {
        message: error.message,
        type: 'error',
      };
    } finally {
      this.inProgress = false;
    }
  };

  /** Sign up user by validating and sending data to server */
  public signUp = async (name: string, email: string, password: string): Promise<void> => {
    this.inProgress = true;

    name = name.trim();
    email = email.trim();

    try {
      /** Check CORS limits */
      if (!this.isCookiesAllowed) {
        await this.openCORSModal();
      }

      await this.validateFields(name, email);
      const response = await authAPIs.register.send(name, email, password);
      const { success, errors, data } = response.data;

      if (success) {
        userStore.awaitsAuth = true;
        CookiesSession.setGuestCommenting(false);
        CookiesSession.setRegularCommenting(true);
        userStore.token = data.authTicket.token;
        userStore.isGuest = false;
        userStore.isAnonymous = false;
        await userStore.authorizeWithToken();
      } else {
        if (errors[0] === 'user_exists') {
          throw new Error(translation.messages.emailExists);
        } else {
          throw new Error(errors[0] || 'Please try again later');
        }
      }
    } catch (error) {
      this.alert.value = { message: error.message, type: 'error' };
    } finally {
      this.inProgress = false;
    }
  };

  /**
   * @private
   * @name openCORSModal
   * @description This is method is used to try to bypass cors limit in some browsers
   * for example our iframe can't use cookies while our site wasn't visited, we open modal to force user
   * to visit site and then we can work with cookies
   */
  private openCORSModal = async (guest: boolean = false, anon: boolean = false) => {
    let authModal: Window | null;
    if (guest) {
      authModal = window.open(
        `${window.location.origin}${process.env.AUTH_CONFIRMATION_HTML}?guest=${guest}`,
        'authVerificationModal',
        'location=0,status=0,width=800,height=400'
      );
    } else if (anon) {
      authModal = window.open(
        `${window.location.origin}${process.env.AUTH_CONFIRMATION_HTML}?anon=${anon}`,
        'authVerificationModal',
        'location=0,status=0,width=800,height=400'
      );
    } else {
      authModal = window.open(
        `${window.location.origin}${process.env.AUTH_CONFIRMATION_HTML}`,
        'authVerificationModal',
        'location=0,status=0,width=800,height=400'
      );
    }

    return new Promise((resolve, reject) => {
      const oauthInterval = window.setInterval(() => {
        if (authModal && authModal.closed) {
          window.clearInterval(oauthInterval);
          resolve();
        }
      }, 1000);
    });
  };

  /**
   * @public
   * @description Open modal window to authorize user
   * @param {'facebook' | 'google' | 'twitter'} network - social network to log in with
   * @return {void}
   */
  public signInWithSocial = (network: 'facebook' | 'google' | 'twitter' | 'disqus'): void => {
    reportEvent(`login_${network}` as 'login_facebook' | 'login_google' | 'login_twitter' | 'login_disqus');

    const options = {
      callback: () => {
        userStore.awaitsAuth = true;
        userStore.isGuest = false;
        userStore.isAnonymous = false;
        CookiesSession.setGuestCommenting(false);
        CookiesSession.setRegularCommenting(true);
        userStore.authorizeWithToken();
      },
      path: '',
    };

    switch (network) {
      case 'google':
        options.path = process.env.GOOGLE_LOGIN_LINK || '';
        break;
      case 'twitter':
        options.path = process.env.TWITTER_LOGIN_LINK || '';
        break;
      case 'disqus':
        options.path = process.env.DISQUS_LOGIN_LINK || '';
        break;
      default:
        options.path = process.env.FACEBOOK_LOGIN_LINK || '';
        break;
    }

    const oauthWindow = window.open(options.path, 'socialAuth', 'location=0,status=0,width=800,height=400');
    const oauthInterval = window.setInterval(() => {
      if (oauthWindow && oauthWindow.closed) {
        window.clearInterval(oauthInterval);
        options.callback();
      }
      // tslint:disable-next-line
    }, 1000);
  };

  /**
   * @name callSSO
   * @description sending message to platform.js with command to open SSO method
   * @return {void}
   */
  public openSSO = (): void => callSSOMethod();

  /**
   * @name closeAlert
   * @description Remove alert
   * @return {void}
   */
  public closeAlert = this.alert.close;

  /**
   * @private
   * @name validateFields
   * @description validate fields before calling APIs which might create new user
   * @param {string} name
   * @param {string} email
   */
  private validateFields = (name: string, email: string) =>
    new Promise((resolve, reject) => {
      if (!isValidName(name) || isOffensive(name)) {
        reject(new Error(translation.common.invalidName));
      }
      if (!isValidEmail(email)) {
        reject(new Error(translation.common.invalidEmail));
      }
      resolve();
    });
}

decorate(AuthStore, {
  alert: observable,
  inProgress: observable,
  loginTypes: observable,

  disqusEnabled: observable,
  facebookEnabled: observable,
  googleEnabled: observable,
  twitterEnabled: observable,
  withPassword: observable,
  withVuukle: observable,
  withSSO: observable,

  closeAlert: action,
  setLoginTypes: action,
  signIn: action,
  signInWithoutPassword: action,
  signOut: action,
  signUp: action,
});

export default new AuthStore();
