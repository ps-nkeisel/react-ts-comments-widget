/**
 * Make the mention button on the toolbar insert an @ inside the editor on the cursor position
 */
export function mentionHandler() {
  // Detect selection to have information and decide what to do next
  const range = this.quill.getSelection();

  // If empty selection
  if (range && range.length === 0) {
    this.quill.insertText(range.index, '@', 'user');
    this.quill.setSelection(range.index + 1);
  }
}
