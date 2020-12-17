/**
 * @file Quill Blots that extend functionality live here
 *
 * @see https://dev.to/charrondev/getting-to-know-quilljs---part-1-parchment-blots-and-lifecycle--3e76
 * @see https://quilljs.com/guides/cloning-medium-with-parchment/
 */
import Quill from 'quill';
const Inline = Quill.import('blots/inline');

/**
 * URL adding blot
 */
export class UrlBlot extends Inline {
  public static blotName = 'url';
  public static tagName = 'a';

  public static create(url: string) {
    const node = super.create();
    // Sanitize url value if desired
    node.setAttribute('href', url);
    // set other non-format related attributes
    // don't set these if it's a hashtag
    if (!url.includes('#hash-')) {
      node.setAttribute('target', '_blank');
      node.setAttribute('rel', 'noopener noreferrer');
    }
    return node;
  }

  public static formats(node: HTMLElement) {
    // We will only be called with a node already
    // determined to be a Link blot, so we do
    // not need to check ourselves
    return node.getAttribute('href');
  }

  /**
   * Don't create a link if it's not specifically a 'link' formatted Blot
   * Need this to prevent ghost link creation when a hashtag is made
   */
  public format(name: any, value: any) {
    if (name !== this.statics.blotName || !value) {
      super.format(name, value);
    } else {
      this.domNode.setAttribute('href', value);
      this.domNode.setAttribute('target', '_blank');
      this.domNode.setAttribute('rel', 'noopener noreferrer');
    }
  }
}

export default UrlBlot;
