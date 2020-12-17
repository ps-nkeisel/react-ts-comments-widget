/**
 * Taken from https://github.com/Weavy/quill-autoformat/blob/master/src/formats/hashtag.js
 *
 * Creates a hashtag format which is then used in autoformat module to automatically transform #text into links
 */

import Quill from 'quill';

const Embed = Quill.import('blots/embed');

class Hashtag extends Embed {
  public static blotName = 'hashtag';
  public static className = 'ql-hashtag';
  public static tagName = 'a';
  public static BASE_URL = '#hash-';

  public static create(value: any) {
    const node = super.create(value);
    node.setAttribute('href', this.BASE_URL + value);
    node.setAttribute('spellcheck', false);
    node.textContent = '#' + value;
    return node;
  }

  public static value(domNode: any) {
    return domNode.textContent.substr(1);
  }
}


export default Hashtag;
