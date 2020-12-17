import * as React from 'react';
import styled from 'styled-components';
import { timeAgo } from 'utils';
import { INotification } from '../store';

import Avatar from '@vuukle/avatar';
import darken from 'polished/lib/color/darken';
import lighten from 'polished/lib/color/lighten';
import { translation } from 'services/translation';

interface IProps {
  className?: string;
  /** Notification object */
  data: INotification;
  /** OnMouseDown listener for custom actions on notification click */
  onMouseDown?: () => void;
  /** Is notification read or not */
  viewed: boolean;
}

const StyledBlockquote = styled.blockquote`
  margin: 0;
  quotes: "“" "”" "‘" "’";
  padding: 4px;
  font-style: italic;

  &:before {
    content: open-quote;
  }

  &:after {
    content: close-quote;
  }
`;

const Notification: React.FC<IProps> = ({ className, data, onMouseDown }) => {
  // For follow notifications we need to send the user to the social app page of the follower
  if (data.notification.notificationType === 7) {
    return (
      <a
        href={
          process.env.NODE_ENV === 'development'
            ? `https://news1.vuukle.com/profile/${data.notification.senderId}`
            : `https://news.vuukle.com/profile/${data.notification.senderId}`
        }
        rel="noopener nofollower"
        target="_blank"
        className={className}
        onMouseDown={onMouseDown}
      >
        <div>
          <Avatar name={data.senderName} hash={data.senderName} src={data.senderPictureUrl} />
        </div>
        <span>
          {data.notification.notificationType === 7 && (
            <>
              <strong>{data.senderName}</strong> {translation.notifications.followingYou}
            </>
          )}
        </span>
      </a>
    );
  }

  /** Return an element with the first 50 letters of a comment */
  const renderCommentQuote = () => (
    <>
      {data.commentFirst50.length > 0 && (
        <StyledBlockquote>
          {data.commentFirst50}
          {data.commentFirst50.length === 50 && '...'}
        </StyledBlockquote>
      )}
    </>
  );

  // Otherwise make a link to a comment
  return (
    <a
      href={`${process.env.API_URL}/stats/External?source=notifications&url=${data.notification.host}${data.notification.uri}#commentID-${data.notification.commentId}`}
      rel="noopener nofollower"
      target="_blank"
      className={className}
      onMouseDown={onMouseDown}
    >
      <div>
        <Avatar name={data.senderName} hash={data.senderName} src={data.senderPictureUrl} />
      </div>
      <span>
        {data.notification.notificationType === 1 && (
          <>
            <strong>{data.senderName}</strong> {translation.notifications.repliedToYourComment}{' '}
            <strong>{data.notification.host}</strong>
            {renderCommentQuote()}
          </>
        )}
        {data.notification.notificationType === 2 && (
          <>
            {translation.notifications.commentRejected} <strong>{data.notification.host}</strong>
            {renderCommentQuote()}
          </>
        )}
        {data.notification.notificationType === 3 && (
          <>
            {translation.notifications.commentApproved} <strong>{data.notification.host}</strong>
            {renderCommentQuote()}
          </>
        )}
        {data.notification.notificationType === 4 && (
          <>
            <strong>{data.senderName}</strong> {translation.notifications.likedYourComment}{' '}
            <strong>{data.notification.host}</strong>
            {renderCommentQuote()}
          </>
        )}
        {data.notification.notificationType === 5 && (
          <>
            <strong>{data.senderName}</strong> {translation.notifications.dislikedYourComment}{' '}
            <strong>{data.notification.host}</strong>
            {renderCommentQuote()}
          </>
        )}
        {data.notification.notificationType === 6 && (
          <>
            <strong>{data.senderName}</strong> {translation.notifications.mentionedYou}{' '}
            <strong>{data.notification.host}</strong>
            {renderCommentQuote()}
          </>
        )}
        {data.notification.notificationType === 8 && (
          <>
            {translation.notifications.sentModeration} <strong>{data.notification.host}</strong>
          </>
        )}
        <p>{timeAgo(data.notification.createdTimestamp)}</p>
      </span>
    </a>
  );
};

const StyledNotification = styled(Notification)`
  ${(props) => {
    if (props.theme.isDark) {
      return props.viewed ? `background: ${darken(0.33, props.theme.mutedColor)};` : `background: #293742;`;
    } else {
      return props.viewed ? `background: ${lighten(0.33, props.theme.mutedColor)};` : `background: #EDF3FC;`;
    }
  }}
  font-size: 0.9rem;
  color: ${(props) =>
    props.theme.isDark ? lighten(0.22, props.theme.mutedColor) : darken(0.22, props.theme.mutedColor)};
  display: flex;
  padding-top: 10px;
  padding-bottom: 10px;
  padding-left: 5px;

  &:hover {
    text-decoration: none;
  }

  ${Avatar} {
    width: 40px;
    margin-right: 5px;
  }

  div {
    display: flex;
  }

  p {
    word-break: break-all;
  }

  span {
    word-break: break-all;
    padding-left: 4px;
    padding-right: 4px;
  }

  span > p {
    margin-top: 4px;
    color: ${(props) => props.theme.mutedColor};
    font-size: 0.88rem;
`;

export default StyledNotification;
