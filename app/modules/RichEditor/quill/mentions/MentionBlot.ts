import Quill from 'quill';
const Embed = Quill.import('blots/embed');

export class MentionBlot extends Embed {
  public static blotName = 'mention';
  public static tagName = 'span';
  public static className = 'mention';

  public static create(data: any) {
    const node = super.create();

    node.innerHTML = `@${data.value}`;

    return MentionBlot.setDataValues(node, data);
  }

  public static setDataValues(element: HTMLElement, data: any) {
    const domNode = element;
    Object.keys(data).forEach((key) => (domNode.dataset[key] = data[key]));
    return domNode;
  }

  public static value(domNode: HTMLElement) {
    return domNode.dataset;
  }
}

export default MentionBlot;
