import * as Cookies from 'js-cookie';
import { getTextFromHTML, isSameSiteNoneIncompatible, truncateString } from '@vuukle/utils';
import { translation } from 'services/translation';
import deviceInfo from 'services/deviceInfo';
import difference from 'lodash/difference';

import WidgetStore from 'stores/widgetStore';

export const cookieOptions: Cookies.CookieAttributes = isSameSiteNoneIncompatible()
  ? {}
  : { sameSite: 'none', secure: true };

/**
 * Generate hash code from string.
 * Used to generate hash to send comment and prevent many comments sending from some program etc.
 * so hash will be different for every sendComment API request
 * https://gitlab.com/vuukle/widget-comments/issues/65
 * @returns {number}
 */
export function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i += 1) {
    hash = ~~((hash << 5) - hash + str.charCodeAt(i)); // tslint:disable-line
  }
  return hash;
}

function timeAgoBuilder() {
  const monthsOptions = { month: 'short', day: 'numeric' };
  const roundTime = (val: number): string => String(Math.abs(Math.round(val)));

  return (date: number): string => {
    const time = new Date(date * 1000);

    const now = new Date();
    const seconds = ((now.getTime() - time.getTime()) * 0.001) >> 0; // tslint:disable-line
    const minutes = seconds / 60;
    const hours = minutes / 60;
    const days = hours / 24;

    return (
      (seconds < 60 && translation.timeAgo.seconds) ||
      (minutes < 60 && translation.timeAgo.minutes.replace('%d', roundTime(minutes))) ||
      (hours < 24 && translation.timeAgo.hours.replace('%d', roundTime(hours))) ||
      (days < 28 && translation.timeAgo.days.replace('%d', roundTime(days))) ||
      (days < 365 && time.toLocaleDateString(translation.timeAgo.locale, monthsOptions)) ||
      `${roundTime(days / 365)}y`
    );
  };
}

export const timeAgo = timeAgoBuilder();

/**
 * @name createTitleExcerpt
 * @param {string} title to truncate
 * @param {number} maxLength - max string length
 * @return {string} excerpt
 */
export const createTitleExcerpt = (title: string, maxLength: number) =>
  truncateString(getTextFromHTML(title), maxLength);

/**
 * Remove accents and punctuation from words in a string
 * @param text Text to normalize
 */
export const normalizeString = (text: string) => {
  // Remove accents
  const normalized = text.normalize('NFKD').replace(/[\u0300-\u036f]/g, '');
  // Remove punctuation and long whitespaces
  return normalized.replace(/[^A-Za-z\s]/g, '').replace(/\s{2,}/g, ' ');
};

/**
 * Computes the Levenshtein edit distance between two strings.
 * @param {string} a
 * @param {string} b
 * @return {number} The edit distance between the two strings.
 */
export function editDistance(a: string, b: string): number {
  const v0 = [];
  const v1 = [];

  // tslint:disable-next-line
  if (a == b) {
    return 0;
  }

  if (!a.length || !b.length) {
    return Math.max(a.length, b.length);
  }

  for (let i = 0; i < b.length + 1; i += 1) {
    v0[i] = i;
  }

  for (let i = 0; i < a.length; i += 1) {
    v1[0] = i + 1;

    for (let j = 0; j < b.length; j += 1) {
      const cost = Number(a[i] != b[j]); // tslint:disable-line
      // Cost for the substring is the minimum of adding one character, removing
      // one character, or a swap.
      v1[j + 1] = Math.min(v1[j] + 1, v0[j + 1] + 1, v0[j] + cost);
    }

    for (let j = 0; j < v0.length; j += 1) {
      v0[j] = v1[j];
    }
  }

  return v1[b.length];
}

/**
 * Get the difference between 2 comments
 * @param a Comment text
 * @param b Comment text to be compared with
 * @returns {Array<number>} Number of words in the second comment and number of unique members between 2 comments
 */
export function commentDifference(a: string, b: string): [number, number] {
  if (!a.length || !b.length) {
    return [0, 0];
  }

  const firstArr = a
    .toLocaleLowerCase()
    .replace(/\s{2,}/g, ' ')
    .split(' ');
  const secondArr = b
    .toLocaleLowerCase()
    .replace(/\s{2,}/g, ' ')
    .split(' ');
  const uniqueMembers = difference(secondArr, firstArr);

  return [secondArr.length, uniqueMembers.length];
}

export const areCookiesSupported = () => {
  Cookies.set('test_cookie_vuukle', 'test', cookieOptions);
  const testCookie = Cookies.get('test_cookie_vuukle');
  if (!testCookie) {
    return false;
  }
  Cookies.remove('test_cookie_vuukle', cookieOptions);
  return true;
};

/** Internet Explorer doesn't disable localStorage after cookies are disabled */
const localStorageEnabled: boolean =
  areCookiesSupported() || (!areCookiesSupported() && deviceInfo.browserName === 'IE');

export function saveTypedComment(comment: string, store: 'English' | 'Foreign', parentID: number): void {
  if (localStorageEnabled) {
    store === 'English'
      ? localStorage.setItem(
          'unposted_comment',
          JSON.stringify({ comment, parentID, articleId: WidgetStore.article.id, host: WidgetStore.article.host })
        )
      : localStorage.setItem(
          'unposted_comment_simplebox',
          JSON.stringify({ comment, parentID, articleId: WidgetStore.article.id, host: WidgetStore.article.host })
        );
  }
}

export function getTypedComment(store: 'English' | 'Foreign') {
  if (localStorageEnabled) {
    /** Safeguard in case we are dealing with badly formed JSON */
    try {
      const parsedComment =
        store === 'English'
          ? JSON.parse(localStorage.getItem('unposted_comment') || '{}')
          : JSON.parse(localStorage.getItem('unposted_comment_simplebox') || '{}');
      /** Fix broken hashtags */
      parsedComment.comment = parsedComment.comment.replace(/>#{1,}/gi, '>');
      return parsedComment;
    } catch (e) {
      return {};
    }
  }
  return {};
}

export function clearTypedComment(store: 'English' | 'Foreign') {
  if (localStorageEnabled) {
    store === 'English'
      ? localStorage.setItem('unposted_comment', '{}')
      : localStorage.setItem('unposted_comment_simplebox', '{}');
  }
}

export function iOSVersion() {
  if (/iP(hone|od|ad)/.test(navigator.platform)) {
    // supports iOS 2.0 and later: <http://bit.ly/TJjs1V>
    const version = (navigator.appVersion).match(/OS (\d+)_(\d+)_?(\d+)?/) || 0;
    return [parseInt(version[1], 10), parseInt(version[2], 10), parseInt(version[3] || 0, 10)];
  }
  return [0, 0, 0];
}
