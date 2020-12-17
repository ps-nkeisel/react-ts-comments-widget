/**
 * @file Contains utility class to init widget height tracking and to post messages
 * to platform.js to resize the widget.
 */

/**
 * Implements class that will track height of a Node and post message
 * to window.parent where our platform.js should handle this message
 * and resize widget
 */
export class WatchHeight {
  private static oldHeight: number;

  /**
   * Initialize WatchHeight -> start height tracking for the provided
   * node and send messages to the platform.js once height changes.
   *
   * @param {HTMLElement} node - HTML element for which height tracking should be applied
   */
  public static init(node: HTMLElement) {
    this.oldHeight = node.offsetHeight || 0;
    setInterval(() => {
      const newHeight: number = node.offsetHeight + 5;

      if (newHeight !== this.oldHeight) {
        this.oldHeight = newHeight;
        this.postNewHeightMessage(newHeight);
      }
    }, 300);
  }

  /**
   * Tries to send message using window.parent.postMessage where
   * platform.js should catch it and resize widget
   *
   * @param {number} newHeight - height to which to resize widget
   */
  private static postNewHeightMessage(newHeight: number) {
    if (!window.parent.postMessage) {
      return;
    }

    window.parent.postMessage(
      JSON.stringify({
        data: { height: newHeight },
        sourceOrigin: window.origin,
        sourceWindowName: window.name,
        type: 'resize',
        widget: 'comments',
      }),
      '*'
    );
  }
}

export default WatchHeight;
