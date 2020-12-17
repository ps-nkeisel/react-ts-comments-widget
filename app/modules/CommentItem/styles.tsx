import Avatar from '@vuukle/avatar';
import styled from 'styled-components';

interface IProps {
  highlighted?: boolean;
  className?: string;
}

export const StyledComment = styled.div<IProps>`
  display: grid;
  position: relative;
  grid-template-rows: auto auto;
  grid-template-columns: auto 1fr;
  grid-template-areas: 'avatar-area comment-area' '. nested-comments-area';

  ${(props) => {
    if (props.highlighted) {
      if (props.theme.isArabic) {
        return `
          border-right: 2px solid #ffd34f;
          padding-right: 5px;
        `;
      } else {
        return `
          border-left: 2px solid #ffd34f;
          padding-left: 5px;
        `;
      }
    }
    return null;
  }}

  ${Avatar} {
    margin-right: 12px;
    grid-area: avatar-area / avatar-area / avatar-area / avatar-area;
  }

  .v-comment__content {
    min-width: 0px;
    word-wrap: break-word;
    grid-area: comment-area / comment-area / comment-area / comment-area;
  }

  .v-comment__comment {
    color: ${(props) => props.theme.textColor};
    margin: 5px 0 10px;
  }
`;
