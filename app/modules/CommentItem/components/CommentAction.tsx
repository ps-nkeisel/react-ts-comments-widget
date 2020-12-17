import transparentize from 'polished/lib/color/transparentize';
import * as React from 'react';
import styled from 'styled-components';

const CommentActionSpan = styled.span`
  align-items: center;
  align-self: center;
  margin: 0;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: ${(props) => (props.theme.isDark ? '#ababab' : '#6b778c')};
  text-decoration: none;

  &:not(:first-child) {
    margin: 0 5px;
    color: ${(props) => (props.theme.isDark ? '#ababab' : '#6b778c')};
  }

  a,
  > [role='button'],
  > span,
  .dropdown-toggle {
    font-size: 0.92em;
    outline: none;
    cursor: pointer;
    color: rgb(107, 119, 140);
    text-decoration: none;
    &:hover {
      text-decoration: underline;
    }
    &:active,
    &:focus {
      box-shadow: 0 0 0 0.1rem ${(props) => transparentize(0.5, props.theme.primaryColor)};
    }
  }

  button {
    &.active {
      background: #deebff;
    }
  }

  div + button {
    font-style: italic;
  }
`;

export interface ICommentActionProps {
  children: React.ReactElement<any> | Array<React.ReactElement<any>> | string;
  className?: string;
  style?: React.CSSProperties;
  onClick?: any;
}

export const CommentAction: React.FC<ICommentActionProps> = ( props ) => {
  const { children } = props;
  return (
    <CommentActionSpan {...props}>
      {typeof children === 'string' ? <span role="button">{children}</span> : children}
    </CommentActionSpan>
  );
};

export default CommentAction;
