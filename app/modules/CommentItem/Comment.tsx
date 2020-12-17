import { observer } from 'mobx-react';
import * as React from 'react';

import Alert from '@vuukle/alert';
import Avatar from '@vuukle/avatar';
import { isTouchScreen } from '@vuukle/utils/src/category/browser';
import { translation } from 'services/translation';
import CommentBody from './components/CommentBody';
import CommentFooter from './components/CommentFooter';
import CommentHeader from './components/CommentHeader';
import HiddenComment from './components/HIddenComment';
import UserCard from './components/UserCard';

import Popover from 'components/Popover';

import { StyledComment } from './styles';

import { IAlert } from 'stores/models/Alert';
import userStore from 'stores/userStore';
import widgetStore from 'stores/widgetStore';

import CommentItem from 'modules/CommentList/store/CommentItem';

import deviceInfo from 'services/deviceInfo';

import { iOSVersion } from 'utils/index';

export interface IProps {
  className?: string;
  /**
   * Comment is highlighted
   * It used when user shares link to comment. When someone opens link we load that comment
   * on the top and highlight it
   */
  highlighted: boolean;
  /** Comment Instance */
  comment: CommentItem;
  /** User is moderator */
  isModerator: boolean;
  /** User is authenticated */
  isAuthorized: boolean;
}

const Comment: React.FC<IProps> = observer((props) => {
  const handleProfileClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    props.comment.showCommenterProfile();
  };

  const followUser = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    props.comment.followUser();
  };

  const unfollowUser = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    props.comment.unfollowUser();
  };

  /**
   * Renders alert based on passed alert obj
   * @param {IAlert['value']} alertVal - alert obj with message and type
   * @param {IAlert['close']} onClose - function to call once alert close button clicked
   * @param {object} style - additional styles for Alert
   *
   * @return React component
   */
  const renderAlert = (alertVal: IAlert['value'], onClose: IAlert['close'], style: React.CSSProperties = {}) => (
    <>
      {alertVal && (
        <Alert type={alertVal.type} onClose={onClose} style={style}>
          <div dangerouslySetInnerHTML={{ __html: alertVal.message }} />
        </Alert>
      )}
    </>
  );

  // tslint:disable-next-line: no-shadowed-variable
  const renderCommentContent = (comment: CommentItem) => (
    <div className="v-comment__content">
      <CommentHeader comment={comment} />
      {/** Comment Text */}
      <CommentBody
        commentText={comment.getCommentTextForRender()}
        edited={comment.data.edited}
        collapsed={comment.collapsed}
      />
      <CommentFooter comment={comment} isModerator={props.isModerator} isAuthorized={props.isAuthorized} />
    </div>
  );

  // tslint:disable-next-line: no-shadowed-variable
  const renderAvatar = (comment: CommentItem) => (
    <>
      {iOSVersion()[0] !== 7 && iOSVersion()[0] !== 8 && iOSVersion()[0] !== 9 && deviceInfo.browserName !== 'IE' && (
        <div className="v-comment__avatar">
          <Avatar
            name={comment.data.name}
            src={comment.data.pictureUrl}
            hash={comment.data.userId || comment.data.name}
            onClick={handleProfileClick}
          />
        </div>
      )}
    </>
  );

  const { comment, className } = props;

  if (comment.isBlocked) {
    return <HiddenComment message={translation.messages.blockedUser} />;
  }

  if (comment.data.commentText === '[Comment deleted by user]' || comment.data.name === 'Deleted Account') {
    return <HiddenComment message={translation.messages.removedComment} />;
  }

  if (comment.data.state === 1) {
    return <HiddenComment message={translation.messages.rejectedComment} />;
  }

  if (comment.data.state !== 0) {
    return (
      <div>
        {renderAlert(comment.topAlert.value, comment.topAlert.close)}
        {renderAlert(comment.bottomAlert.value, comment.bottomAlert.close)}
      </div>
    );
  }

  return (
    <div>
      {/** Top Alert for errors/warning */}
      {renderAlert(comment.topAlert.value, comment.topAlert.close)}
      {/** Comment */}
      <StyledComment className={`v-comment-item ${className}`} highlighted={props.highlighted}>
        {!isTouchScreen() ? (
          <Popover
            appearOn="hover"
            component={
              <UserCard
                img={comment.data.pictureUrl}
                userName={comment.data.name}
                userId={comment.data.userId}
                loading={!comment.userActions.loaded}
                profileLink={
                  widgetStore.disabledOptions.includes('fullProfile') ||
                  widgetStore.anonymousCommenting ||
                  userStore.isGuest
                    ? ''
                    : `https://news.vuukle.com/profile/${comment.data.userId}`
                }
                commentCount={comment.userActions.comments + comment.userActions.replies}
                votesCount={comment.userActions.votes}
                followerCount={comment.userActions.followers}
                onClick={handleProfileClick}
                followUser={followUser}
                unfollowUser={unfollowUser}
                isOwner={comment.isOwner}
                isAuthorized={props.isAuthorized}
                isFollowing={userStore.isFollowing(comment.data.userId)}
                hideFollow={userStore.isGuest || userStore.isAnonymous}
              />
            }
            placement="right"
            onMouseEnter={props.comment.getUserActions}
          >
            {renderAvatar(comment)}
          </Popover>
        ) : (
          renderAvatar(comment)
        )}
        {renderCommentContent(comment)}
      </StyledComment>
      {/** Bottom Alert for errors/warning */}
      {renderAlert(comment.bottomAlert.value, comment.bottomAlert.close, {
        marginBottom: 0,
        marginTop: '5px',
      })}
    </div>
  );
});

Comment.defaultProps = {
  className: '',
};

export default Comment;
