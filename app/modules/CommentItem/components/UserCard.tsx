import Avatar from '@vuukle/avatar';
import Loader from '@vuukle/loader';
import * as React from 'react';
import { translation } from 'services/translation';
import styled from 'styled-components';

interface IProps {
  className?: string;
  /** User image/avatar */
  img: string;
  /** Number of comments user left */
  commentCount: number | null;
  /** Number of votes user has */
  votesCount: number | null;
  /** Number of followers */
  followerCount: number | null;
  /** Link to user's social app profile */
  profileLink: string;
  /** Show a loader in case some of the passed data isn't loaded */
  loading: boolean;
  /** The user's name */
  userName: string;
  /** Used to hide the follow/unfollow button */
  isOwner: boolean;
  /** If user is not authorized, they shouldn't see the follow button */
  isAuthorized: boolean;
  /** Is the user already following the author of the comment */
  isFollowing: boolean;
  /** User ID. Used for Avatar hash */
  userId?: string;
  /** Optional click event handler to make username clickable */
  onClick?: (e: React.MouseEvent<any>) => void;
  /** Click handler for following a user */
  followUser: (e: React.MouseEvent<any>) => void;
  /** Click handler for unfollowing a user */
  unfollowUser: (e: React.MouseEvent<any>) => void;
  /** Hide follow option */
  hideFollow: boolean;
}

const UserCard: React.FC<IProps> = ({
  className,
  img,
  commentCount,
  votesCount,
  followerCount,
  profileLink,
  loading,
  onClick,
  userId,
  userName,
  followUser,
  isFollowing,
  isOwner,
  unfollowUser,
  hideFollow,
}) => (
  <div className={className}>
    <div>
      <Avatar name={userName} src={img} hash={userId || userName} />
      <div>
        <a href="#no" onClick={onClick}>
          {userName}
        </a>
        {!loading ? (
          <>
          {typeof commentCount === 'number' && (
            <small>
              {commentCount}{' '}
              {commentCount > 1 || commentCount === 0
                ? translation.commentText.whenX.toLocaleLowerCase()
                : translation.commentText.when1.toLocaleLowerCase()}
            </small>
          )}
          {typeof votesCount === 'number' && (
            <small>
              {votesCount}{' '}
              {votesCount > 1 || votesCount === 0
                ? translation.votesText.whenX.toLocaleLowerCase()
                : translation.votesText.when1.toLocaleLowerCase()}
            </small>
          )}
          {typeof followerCount === 'number' && (
            <small>
              {followerCount}{' '}
              {followerCount > 1 || followerCount === 0
                ? translation.followerText.whenX.toLocaleLowerCase()
                : translation.followerText.when1.toLocaleLowerCase()}
            </small>
          )}
          </>
        ):(
          <Loader style={{ margin: '5px auto' }} />
        )}
      </div>
    </div>
    <div>
      {!isOwner && !hideFollow && (
        <a href="#no" rel="nofollow" onClick={isFollowing ? unfollowUser : followUser}>
          {isFollowing ? translation.unfollow : translation.follow}
        </a>
      )}
      {profileLink && (
        <a href={profileLink} target="_blank" rel="noopener nofollow">
          {translation.profileCard.fullProfile}
        </a>
      )}
    </div>
  </div>
);

const StyledCard = styled(UserCard)`
  background: ${(props) => (props.theme.isDark ? '#293742' : '#fff')};
  box-shadow: 0 0 3px 0 rgba(0, 0, 0, 0.4);
  border-radius: 3px;

  /** Top of the Card */
  > div:first-child {
    display: flex;
    align-items: center;
    word-break: break-word;
    padding: 5px;

    ${Avatar} {
      width: 40px;
      height: 40px;
      margin-right: 10px;

      ::before {
        white-space: nowrap;
      }
    }

    small {
      color: ${(props) => props.theme.mutedColor};
      display: inline-block;
      /** Add • symbol between small elements */
      + small {
        margin-left: 10px;
      }
    }

    a {
      display: block;
      font-weight: bold;
      line-height: 1rem;
      color: ${(props) => props.theme.textColor};
      ${(props) => props.onClick && 'cursor: pointer;'}
    }
  }

  /** Bottom of the Card */
  > div:last-child {
    padding: 3px;
    background: ${(props) => (props.theme.isDark ? '#39434a' : '#e7e9ee')};
    text-align: right;
    a {
      color: ${(props) => props.theme.textColor};
      font-size: 0.9em;
      margin-left: 10px;
    }
  }
`;

export default StyledCard;
