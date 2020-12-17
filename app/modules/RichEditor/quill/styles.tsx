/**
 * @file Quill Editor Styles
 *
 * For bigger list available styles @see {@link /node_modules/quill/dist/quill.snow.css}
 */
import { css } from 'styled-components';

/** Export Styles for quill */
export const quillStyles = css`
  .ql-container {
    box-sizing: border-box;
    height: 100%;
    margin: 0px;
    position: relative;
    min-height: 70px;
    max-height: 300px;
    overflow-y: auto;
  }

  .ql-clipboard {
    left: -100000px;
    height: 1px;
    overflow-y: hidden;
    position: absolute;
    top: 50%;
  }
  .ql-clipboard p {
    margin: 0;
    padding: 0;
  }

  .ql-editor.ql-blank::before {
    opacity: 0.6;
    content: attr(data-placeholder);
    font-style: italic;
    left: 15px;
    pointer-events: none;
    position: absolute;
    right: 15px;
  }

  .ql-editor {
    box-sizing: border-box;
    line-height: 1.42;
    height: 100%;
    outline: none;
    overflow-y: auto;
    padding: 12px 15px;
    tab-size: 4;
    -moz-tab-size: 4;
    text-align: left;
    white-space: pre-wrap;
    word-wrap: break-word;
  }
  .ql-editor > * {
    cursor: text;
  }
`;

export default quillStyles;
