/**
 * @file Handlers that are used inside default toolbar quill module
 *
 * @see Editor.tsx - registers handlers there
 * @see {@link https://quilljs.com/docs/modules/toolbar/#handlers}
 */

/**
 * URL adding handler
 *
 * @this toolbar - quill toolbar module
 */
export function urlHandler() {
  const isWithProtocolor = (url: string): boolean => /^(https|http):\/\//.test(url);
  const addDefaultProtocol = (url: string): string => `http://${url}`;

  // Detect selection to have information and decide what to do next
  const range = this.quill.getSelection();

  // If empty selection
  if (range && range.length === 0) {
    let url = prompt('Enter link URL:');
    if (!url) {
      return;
    }

    // If protocol is missing add http:// as default one
    if (!isWithProtocolor(url)) {
      url = addDefaultProtocol(url);
    }

    this.quill.insertText(range.index, url, { url }, 'user');
    this.quill.setSelection(range.index + url.length); // Move cursor to the end of text
  } else {
    // User selected text so we just need to add link to this selection
    // If user selected text that is already a link
    if (range) {
      const format = this.quill.getFormat(range);
      let url = prompt('Enter link URL:', format.link || format.url || undefined);
      // prompt canceled
      if (url === null) {
        return;
      }

      // submited empty link
      if (!url) {
        this.quill.format('url', undefined, 'user'); // Remove link formation
        return;
      }

      if (!isWithProtocolor(url)) {
        url = addDefaultProtocol(url);
      }

      this.quill.format('url', url, 'user');
    }
  }
}
