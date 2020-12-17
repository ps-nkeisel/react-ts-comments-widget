import * as Cookies from 'js-cookie';
import { isSameSiteNoneIncompatible } from '@vuukle/utils';
import { cookieOptions, editDistance } from 'utils';

/**
 * Check if comment is similar to previously posted (we save it with help of: saveCommentForComparison)
 * @param {string} newComment - comment to compare (comment user wants to post)
 * @returns {boolean}
 */
export function compareWithPreviousComment(newComment: string): boolean {
  const prevComment = Cookies.get('prevc');
  if (!prevComment) {
    return false;
  }

  const differenceDistance = editDistance(prevComment, newComment);
  if (differenceDistance === 0 || newComment.length === 0) {
    return true; // Comments are exactly same
  }

  /** Check if previous comment and new comment have difference less than 25% */
  if (differenceDistance / newComment.length < 0.25) {
    return true;
  }

  /** Comment Passed checking */
  return false;
}

/**
 * After comment post we save cookie to use in compareWithPreviousComment for detection if user tries to spam
 * @param {string} comment - comment text to save for comparison
 */
export const saveCommentForComparison = (comment: string): void =>
  Cookies.set(
    'prevc',
    comment,
    isSameSiteNoneIncompatible() ? { expires: 20 } : { expires: 20, ...cookieOptions }
  );
