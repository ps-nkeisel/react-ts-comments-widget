import { detectBrowser, isMobile } from '@vuukle/utils/src/category/browser';

/**
 *  Detect if the browser is Safari by checking vendor
 *  Then checking if the browser isn't Chrome or Firefox on iOS
 */
const isSafari =
  navigator.vendor &&
  navigator.vendor.indexOf('Apple') > -1 &&
  navigator.userAgent &&
  navigator.userAgent.indexOf('CriOS') === -1 &&
  navigator.userAgent.indexOf('FxiOS') === -1;

export default {
  browserName: detectBrowser().name,
  isEdge: navigator.userAgent.indexOf('Edge/') > -1,
  isMobile: isMobile(),
  isiOS: /iPad|iPhone|iPod/.test(navigator.userAgent),
  isSafari,
};
