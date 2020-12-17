import Button from '@vuukle/button';
import { isTouchScreen } from '@vuukle/utils';
import { observer } from 'mobx-react';
import * as React from 'react';
import styled from 'styled-components';

import { translation } from 'services/translation';

import CommentAction from './CommentAction';
import DropdownMore from './DropdownMore';
import ReportComment from './ReportComment';
import CommentShare from './ShareCommentAction';
import VoteIcon from './VoteIcon';

import userStore from 'stores/userStore';

import RealtimeStore from 'modules/RealtimeTyping/store';

const FooterWrapper = styled.div`
  align-items: center;
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  margin-top: 5px;
  > div {
    display: flex;
    align-items: center;
  }
`;

const BlueLine = styled.div`
  height: 3px;
  background: #2e9fff;
  margin-left: 15px;
  width: 80%;
`;

/** Component Props */
import CommentItem from 'modules/CommentList/store/CommentItem';
import widgetStore from 'stores/widgetStore';
import NewCommentsNotifier from 'modules/RealtimeTyping/components/NewCommentsNotifier';
interface IProps {
  comment: CommentItem;
  isModerator: boolean;
  isAuthorized: boolean;
}

const CommentFooter: React.FC<IProps> = observer(({ comment, isModerator }) => {
  const toggleReplyBox = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    comment.toggleReplyBox();
  };

  /**
   * @name getDropdownOptions
   * @description creates array of comment actions for dropdown
   */
  const getDropdownOptions = () => {
    const options: Array<{ name: string; onClick: () => void }> = [
      {
        name: `${comment.collapsed ? translation.common.expand : translation.common.collapse}`,
        onClick: comment.collapse,
      },
    ];

    /** Detect if it's comment owner and not a guest/anon to show delete comment action */
    if (comment.isOwner && !userStore.isGuest && !userStore.isAnonymous) {
      options.unshift({
        name: translation.common.remove,
        onClick: () => comment.remove(),
      });
    }

    if (!comment.isOwner) {
      if (!userStore.isAnonymous) {
        options.unshift({ name: translation.common.blockUser, onClick: comment.blockCommenter });
      }
      /** If on a touch screen device and the user is not a guest or anon */
      if (isTouchScreen() && !userStore.isGuest && !userStore.isAnonymous) {
        userStore.isFollowing(comment.data.userId)
          ? options.unshift({ name: translation.unfollow, onClick: comment.unfollowUser })
          : options.unshift({ name: translation.follow, onClick: comment.followUser });
      }
    }

    /** Add one more option to moderate comment */
    if (isModerator && userStore.details && userStore.details.isPasswordEntered) {
      options.unshift({ name: translation.moderation.rejectComment, onClick: comment.reject });
    }
    return options;
  };

  /**
   * Likes Count click handler.
   * It should open modal widget where modal widget will load users who liked the comment.
   * @param {React.MouseEvent<HTMLAnchorElement>} e - Mouse click event
   * @return {void}
   */
  const onLikesCountClick = (e: React.MouseEvent<HTMLAnchorElement>): void => {
    e.preventDefault();
    comment.toggleCommentLikesView();
  };

  /**
   * Likes Count click handler.
   * It should open modal widget where modal widget will load users who disliked the comment.
   * @param {React.MouseEvent<HTMLAnchorElement>} e - Mouse click event
   * @return {void}
   */
  const onDislikesCountClick = (e: React.MouseEvent<HTMLAnchorElement>): void => {
    e.preventDefault();
    comment.toggleCommentDislikesView();
  };

  /**
   * Renders Left Side of of the footer
   * @return {React.ReactElement[]} Elements on left side
   */
  const renderLeftSide = (): React.ReactElement[] => {
    const elemsToRender = [
      <CommentAction key="like">
        <Button
          type="link"
          onClick={comment.toggleLike}
          active={comment.liked}
          sm={true}
          style={{ paddingRight: '2px' }}
          loading={comment.likes.loading}
        >
          <VoteIcon isVoted={comment.liked} type="like" />
        </Button>
      </CommentAction>,
    ];

    /** Add Likes Count Button only if likes exist */
    if (comment.likes.count > 0) {
      elemsToRender.push(
        <a
          href="#no"
          key="likes"
          style={{ marginLeft: '2px', color: 'rgb(107,119,140)', fontSize: '0.92em' }}
          onClick={onLikesCountClick}
        >
          <strong>{comment.likes.count}</strong>
        </a>
      );
    }

    /**
     * Add Downvote button
     */
    elemsToRender.push(
      <CommentAction key="downvote">
        <Button
          type="link"
          onClick={comment.toggleDownvote}
          active={comment.disliked}
          sm={true}
          loading={comment.dislikes.loading}
        >
          <VoteIcon isVoted={comment.disliked} type="dislike" />
        </Button>
        {/** Add dislikes counter only if there are dislikes */}
        {comment.dislikes.count > 0 && (
          <a
            href="#no"
            key="dislikes"
            style={{ color: 'rgb(107,119,140)', fontSize: '0.92em' }}
            onClick={onDislikesCountClick}
          >
            <strong>{comment.dislikes.count}</strong>
          </a>
        )}
      </CommentAction>
    );

    /** Add Shares Dropdown */
    elemsToRender.push(
      <CommentShare key="2" onClick={comment.share}>
        {translation.common.share}
      </CommentShare>
    );

    /** Add Toggle Reply (Write Comment) Action */
    if (comment.showReplyButton) {
      elemsToRender.push(
        <CommentAction key="3">
          <a href="#no" onClick={toggleReplyBox}>
            {translation.common.reply /* Reply */}
          </a>
        </CommentAction>
      );
    }

    return elemsToRender;
  };

  /**
   * Renders Elements on right side
   * @return {React.ReactElement[]} Elements on right side
   */
  const renderRightSide = (): React.ReactElement[] => {
    const actions = [];

    let newReplyCount;
    let commentReplyCount;

    try {
      if (Array.isArray(RealtimeStore.commentReplyCounts)) {
        commentReplyCount = RealtimeStore.commentReplyCounts.find((counts) => counts.commentId === comment.data.id);
      } else {
        newReplyCount = RealtimeStore.commentReplyCounts
          ? RealtimeStore.commentReplyCounts[comment.data.id] || comment.replies.length
          : comment.replies.length;
      }

      if (commentReplyCount) {
        newReplyCount = commentReplyCount.replyCount;
      }
    } catch (e) {
      newReplyCount = comment.replies.length;
    }

    /** Add 'Edit' action if it's owner of the comment */
    if (comment.isOwner && !userStore.isAnonymous && !userStore.isGuest) {
      actions.push(
        <CommentAction key="commentAction" onClick={() => (comment.editMode = !comment.editMode)}>
          {translation.common.edit}
        </CommentAction>
      );
      /** Add Realtime reply counter */
      if (widgetStore.realtime && newReplyCount) {
        actions.push(
          <CommentAction key="loadReplies">
            <BlueLine />
            <NewCommentsNotifier
              newCommentsCount={newReplyCount - comment.replies.length}
              loadReplies={true}
              comment={comment}
            />
          </CommentAction>
        );
      }
    } else {
      /** Add Realtime reply counter */
      if (widgetStore.realtime && newReplyCount) {
        actions.push(
          <CommentAction key="loadReplies">
            <BlueLine />
            <NewCommentsNotifier
              newCommentsCount={newReplyCount - comment.replies.length}
              loadReplies={true}
              comment={comment}
            />
          </CommentAction>
        );
      }
      actions.push(
        <CommentAction key="reportComment">
          <ReportComment reportFunction={comment.report} />
        </CommentAction>
      );
    }

    /** Add Dropdown With more options */
    actions.push(<DropdownMore key="dropdown" options={getDropdownOptions()} style={{ marginLeft: '5px' }} />);

    return actions;
  };

  return (
    <FooterWrapper className="v-comment-footer">
      <div>{!comment.collapsed && renderLeftSide()}</div>
      <div>{renderRightSide()}</div>
    </FooterWrapper>
  );
});

export default CommentFooter;
