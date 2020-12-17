import Avatar from '@vuukle/avatar';
import darken from 'polished/lib/color/darken';
import getLuminance from 'polished/lib/color/getLuminance';
import { css } from 'styled-components';

export const mentionStyles = css`
  .ql-container {
    position: initial;
  }
  .ql-wrapper {
    position: relative;
  }

  .ql-mention-list-container {
    width: 270px;
    border-radius: 4px;
    z-index: 9001;
    ${(props) =>
      props.theme.isDark
        ? css`
            background: #545b61;
            border: 1px solid #808080;
            box-shadow: 0 0 0 1px rgba(16, 22, 26, 0.2), 0 0 0 rgba(16, 22, 26, 0), 0 1px 1px rgba(16, 22, 26, 0.4);
          `
        : css`
            background: #fff;
            border: 1px solid #f0f0f0;
            box-shadow: 0 2px 12px 0 rgba(30, 30, 30, 0.08);
          `};
  }

  .ql-mention-list {
    max-height: 120px;
    overflow-y: auto;

    list-style: none;
    margin: 0;
    padding: 0;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .ql-mention-list-item {
    display: flex;
    align-items: center;
    cursor: pointer;
    height: 40px;
    line-height: 36px;
    font-size: 1em;
    padding: 0 10px;
    vertical-align: middle;

    & + & {
      margin-top: 10px;
    }

    ${Avatar} {
      flex-shrink: 0;
    }

    > span {
      margin: 0 5px;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    &.selected {
      background: ${(props) => darken(0.08, props.theme.primaryColor)};
      color: ${(props) => (getLuminance(darken(0.08, props.theme.primaryColor)) > 0.3 ? '#000' : '#fff')};
      text-decoration: none;
    }
  }

  .mention {
    display: inline-block;
    border-radius: 6px;
    background-color: ${(props) => (props.theme.isDark ? '#fafafa' : '#efefef')};
    background: ${(props) => props.theme.tags.primary};
    color: ${(props) => (getLuminance(props.theme.tags.primary) > 0.3 ? '#000' : '#fff')};
    padding: 2px;
    > span {
      margin: 0 3px;
    }
  }
`;

export default mentionStyles;
