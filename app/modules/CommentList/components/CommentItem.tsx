import { observer } from 'mobx-react';
import * as React from 'react';
import styled from 'styled-components';

import Comment from 'modules/CommentItem';
import CommentModel from 'modules/CommentList/store/CommentItem';
import EditCommentBox from 'modules/EditCommentBox';
import WriteComment from 'modules/WriteComment';
import ProtectedAction from './ProtectedAction';

import { isMobile } from '@vuukle/utils';

import RealtimeStore, { IRealtimeCommentReply, IRealtimeNewCommentReply, IRealtimeTypingData } from 'modules/RealtimeTyping/store';
import widgetStore from 'stores/widgetStore';
import TypingNotifier from 'modules/RealtimeTyping/components/TypingNotifier';

interface ICommentProps {
  comment: CommentModel;
  isModerator: boolean;
  isAuthorized: boolean;
  isRepliedTo: boolean;
  className?: string;
  replyCounts?: IRealtimeCommentReply[] | IRealtimeNewCommentReply | undefined;
  writingUsers?: IRealtimeTypingData[];
  writingUsersCommentIDs?: number[];
}

const Wrapper = styled.div`
  margin: 10px 0;
  padding-bottom: 10px;
  &:not(:last-child) {
    border-bottom: 0.05rem solid ${(props) => (props.theme.isDark ? '#757575' : '#e7e9ed')};
  }
`;

const RepliesWrapper = styled('div')`
  ${Wrapper} {
    border-bottom: 0;
    padding-bottom: 0;
  }

  ${() =>
    isMobile()
      ? `
    margin-left: 10px;
    & & & {
      margin-left: 0px;
    }
  `
      : `
    margin-left: 15px;
    margin-top: 15px;
  `}
`;

const CommentItem: React.FC<ICommentProps> = observer(
  ({ comment, isModerator, isAuthorized, isRepliedTo, className }) => {
    const realtimeObject =
      RealtimeStore.writingUsers && RealtimeStore.writingUsers.find((obj) => obj.commentId === comment.data.id);

    const repliedTo = (reply: CommentModel) =>
      widgetStore.realtime &&
      typeof RealtimeStore.writingUsersCommentIDs !== 'undefined' &&
      RealtimeStore.writingUsersCommentIDs.indexOf(reply.data.id) > -1;

    return (
      <Wrapper className={className}>
        {comment.editMode ? (
          <EditCommentBox comment={comment} onClose={() => (comment.editMode = false)} />
        ) : (
          <Comment
            comment={comment}
            highlighted={comment.highlighted}
            isModerator={isModerator}
            isAuthorized={isAuthorized}
          />
        )}

        {/** Remove comment confirmation box */}
        {comment.showPasswordProtection && !comment.collapsed && (
          <ProtectedAction
            onClose={() => (comment.showPasswordProtection = false)}
            onSuccess={() => {
              comment.showPasswordProtection = false;
              // Set timeout for remove function so UI can react for previous changes first
              setTimeout(comment.remove, 700);
            }}
          />
        )}

        {/** Write comment box with sign in */}
        {comment.showReplyBox && (
          <div style={{ margin: '10px 0' }}>
            <WriteComment
              name={comment.data.name}
              // TODO: mb rename this prop
              addComment={(commentItem: Comments.ServerComment) => {
                comment.addReply(commentItem); // Add reply to this comment
                comment.toggleReplyBox(); // Hide reply on success
              }}
              parentId={comment.data.id}
            />
          </div>
        )}

        {/* Replies */}
        {!comment.collapsed && (
          <RepliesWrapper>
            {/** Value is the number of people replying */}
            {isRepliedTo && typeof realtimeObject !== 'undefined' && (
              <TypingNotifier writingUsers={realtimeObject.writingCommentCount} />
            )}
            {comment.replies.length > 0 &&
              comment.replies.map((reply: CommentModel) => (
                <CommentItem
                  isRepliedTo={repliedTo(reply)}
                  isModerator={isModerator}
                  isAuthorized={isAuthorized}
                  comment={reply}
                  key={reply.data.id}
                />
              ))}
          </RepliesWrapper>
        )}
      </Wrapper>
    );
  }
);

export default CommentItem;
