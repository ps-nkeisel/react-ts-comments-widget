/**
 * @file contains utils to work with cookies session
 */
import * as Cookies from 'js-cookie';
import urlSearchParams from 'services/urlSearchParams';
import { isSameSiteNoneIncompatible } from '@vuukle/utils';

/**
 * Class contains static methods to work with session in cookies.
 * Mainly it's to save/delete token, and to manage user api key in cookies
 */
class CookiesSession {
  private static readonly apiKey = urlSearchParams.get('apiKey');
  /** Check if anonymous commenting is enabled */
  private static readonly anonCommenting: boolean = urlSearchParams.get('anonymous') === 'true';
  private static extraOptions: Partial<Cookies.CookieAttributes> = isSameSiteNoneIncompatible()
    ? {}
    : { sameSite: 'none', secure: true };
  public static defaultCookieOptions: Cookies.CookieAttributes =
    process.env.NODE_ENV === 'production'
      ? { domain: '.vuukle.com', expires: 30, ...CookiesSession.extraOptions }
      : { expires: 30, ...CookiesSession.extraOptions };

  /**
   * Detect if we need to use token that will be only used for one publisher.
   * If all auth methods are disabled then we use SSO feature, this means that token should be unique for publisher
   * and authorization from other sites should not work here.
   */
  private static useIsolatedToken: boolean = false;

  /**
   * For guest commenting (not guest + anonymous)
   * We use a separate token called 'guest_token'
   */
  public static guestCommenting: boolean = false;

  /**
   * Use regular or SSO session ('apikey-token' or 'token')
   */
  public static regularCommenting: boolean = true;

  /** Check if SSO or Regular token is present */
  public static isRegularTokenPresent(): boolean {
    return (
      Cookies.get(
        `${this.useIsolatedToken ? CookiesSession.apiKey + '-' : ''}${process.env.SESSION_COOKIE_NAME || 'token'}`
      ) !== undefined
    );
  }

  public static isAnonymousTokenPresent(): boolean {
    return Cookies.get('anonymous_token') !== undefined;
  }

  /**
   * For SSO auth, we need to use unique identifiers like publisher API key to generate a unique token name,
   * so that it can be isolated from other cookies.
   * For Anonymous commenting we will use 'anonymous_token'
   * For Guest commenting we will use 'guest_token'
   * For SSO we use 'apiKey-token' combination
   * For Regular commenting we will use the environment variable or 'token'.
   * Regular token will be preferred over guest and anonymous tokens if present
   */
  public static get tokenName(): string {
    const regularOrSSOToken: boolean = this.isRegularTokenPresent();

    if (regularOrSSOToken || this.regularCommenting) {
      return `${this.useIsolatedToken ? CookiesSession.apiKey + '-' : ''}${process.env.SESSION_COOKIE_NAME || 'token'}`;
    } else if (this.guestCommenting && !this.anonCommenting) {
      return 'guest_token';
    } else {
      return 'anonymous_token';
    }
  }

  /**
   * Set the useIsolatedToken variable.
   * @param useIsolatedToken Determine if isolated tokens should be used or not
   */
  public static setSSOInfo(useIsolatedToken: boolean) {
    this.useIsolatedToken = useIsolatedToken;
  }

  /**
   * Set the guestCommenting variable.
   * @param guestCommenting Determine if guest tokens should be used or not
   */
  public static setGuestCommenting(guestCommenting: boolean) {
    this.guestCommenting = guestCommenting;
  }

  /**
   * Set the regularCommenting variable.
   * @param regularCommenting Determine if user session is regular
   */
  public static setRegularCommenting(regularCommenting: boolean) {
    this.regularCommenting = regularCommenting;
  }

  /**
   * Saves token in cookies based on value
   * @param {string} token - token value to save
   */
  public static saveToken(token: string) {
    Cookies.set(CookiesSession.tokenName, token, CookiesSession.defaultCookieOptions);
  }

  /**
   * Removes token from cookies
   * @return {void}
   */
  public static removeToken(): void {
    Cookies.remove(CookiesSession.tokenName, CookiesSession.defaultCookieOptions);
  }

  /**
   * Returns token from cookies if exists otherwise undefined
   * @return {string | undefined} token value or undefined if not found
   */
  public static getToken(): string | undefined {
    return Cookies.get(CookiesSession.tokenName);
  }

  /**
   * Saves user api key in cookies
   * @param {string} apiKey - API key value to save
   */
  public static saveUserAPIKey(apiKey: string) {
    Cookies.set('uid', apiKey, CookiesSession.defaultCookieOptions);
  }

  /**
   * Removes user API key from cookies
   * @return {void}
   */
  public static removeUserAPIKey(): void {
    Cookies.remove('uid', CookiesSession.defaultCookieOptions);
  }

  /**
   * Get user API key or UID from cookies
   * @return {string} UID value
   */
  public static getUserAPIkey(): string {
    // If comments widget saved uid for us
    const userID = Cookies.get('uid');
    if (userID) {
      return userID;
    }
    // If we created anon id earlier to reuse
    const oldAnonID = Cookies.get('uid-s');
    if (oldAnonID) {
      return oldAnonID;
    }
    // Otherwise create it, save in cookies and return
    const anonID = `${CookiesSession.generateGUID().substring(1)}`;
    Cookies.set('uid-s', anonID, { expires: 365, sameSite: 'lax' });
    return anonID;
  }

  /**
   * @private
   * Generates new GUID string (mostly used to generate anon GUID)
   * @return {string} generated GUID
   */
  private static generateGUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c: any) => {
      // tslint:disable no-bitwise
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }
}

export default CookiesSession;
