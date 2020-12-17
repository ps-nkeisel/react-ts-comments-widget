import Link from '@vuukle/link';
import Tag from '@vuukle/tag';
import darken from 'polished/lib/color/darken';
import lighten from 'polished/lib/color/lighten';
import * as React from 'react';
import styled from 'styled-components';

import ReplyIcon from 'components/ReplyIcon';

import { translation } from 'services/translation';

/** Header Wrapper */
const Wrapper = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: flex-start;

  > div {
    flex-wrap: wrap;
    display: inline-flex;
    flex-direction: row;
    align-items: center;
  }

  .v_comment__name {
    word-break: break-word;
  }

  time,
  .points {
    font-size: 0.8em;
    display: inline-block;
    margin-left: 5px;
    margin-right: 5px;
  }

  time {
    color: ${(props) => props.theme.mutedColor};
  }
`;

/** Component Props */
import CommentItem from 'modules/CommentList/store/CommentItem';
interface IProps {
  comment: CommentItem;
}

/** Custom Name Link */
const NameLink = styled((props) => <Link {...props} />)`
  font-size: 13.5px;
  color: ${(props) => props.theme.textColor};

  &:hover,
  &:active,
  &:focus {
    text-decoration: none;
    color: ${(props) => lighten(0.1, props.theme.textColor)};
  }

  &:focus {
    text-decoration: underline;
  }
`;

const ReplyNameLink = styled((props) => <NameLink {...props} />)`
  color: ${(props) => props.theme.mutedColor};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 115px;
  width: auto;
  transition: all 0.2s;

  svg {
    margin: 0 5px;
    fill: ${(props) => props.theme.mutedColor};
    transition: all 0.2s;
  }

  &:hover,
  &:active,
  &:focus {
    svg {
      fill: ${(props) =>
        props.theme.isDark ? lighten(0.1, props.theme.mutedColor) : darken(0.15, props.theme.mutedColor)};
    }
    color: ${(props) =>
      props.theme.isDark ? lighten(0.1, props.theme.mutedColor) : darken(0.15, props.theme.mutedColor)};
  }
`;

const CommentHeader: React.FC<IProps> = ({ comment }) => {
  const isModerator = (
    comment.data.authorType === 1 ||
    comment.data.authorType === 2 ||
    comment.data.authorType === 3
  );

  /**
   * @name showProfile
   * @description Shows the commenter profile while preventing the user from changing the iframe to the social app
   * once they right click on username and then press 'Open link in new tab' they will be shown the social app page of the comment author
   * @return {void}
   */
  const showProfile = (e: React.MouseEvent): void => {
    e.preventDefault();
    comment.showCommenterProfile();
  };

  const { data, parentComment } = comment;

  return (
    <Wrapper className="v-comment__top">
      <div>
        <NameLink
          href={`https://news.vuukle.com/profile/${data.userId}`}
          className="v_comment__name"
          onClick={showProfile}
        >
          <strong>{data.name}</strong>
        </NameLink>
        {isModerator && (
          <Tag type="warning" key="mod" style={{ verticalAlign: 'top', margin: '0 5px' }}>
            {translation.common.moderator}
          </Tag>
        )}
        {parentComment && (
          <ReplyNameLink
            href="#no"
            className="v_comment__name v_comment__reply-to-user"
            onClick={parentComment.showCommenterProfile}
          >
            <ReplyIcon />
            <span>{parentComment.data.name}</span>
          </ReplyNameLink>
        )}
        {data.timeago && <time>{data.timeago}</time>}
      </div>
    </Wrapper>
  );
}

export default CommentHeader;
