import { observer } from 'mobx-react';
import * as React from 'react';

import Button from '@vuukle/button';
import Loader from '@vuukle/loader';

import { translation } from 'services/translation';

import Comment from './components/CommentItem';
import SortingRow from './components/SortingRow';

/** MobX Store */
import userStore from 'stores/userStore';
import commentsStore from './store';

import NewCommentsNotifier from 'modules/RealtimeTyping/components/NewCommentsNotifier';
import RealtimeStore from 'modules/RealtimeTyping/store';
import widgetStore from 'stores/widgetStore';
import TypingNotifier from 'modules/RealtimeTyping/components/TypingNotifier';

const Comments: React.FC = observer(() => {
  const {
    newCommentsCount,
    writingUsersNumber,
    writingUsersCommentIDs,
    commentReplyCounts,
    writingUsers,
  } = RealtimeStore;
  const { comments, loading, totalComments, moreAvailable, sortBy, selectedComment } = commentsStore;

  const isAuthorized = !!userStore.details;
  const isModerator = (userStore.details && userStore.details.isModerator) || false;

  return (
    <>
      {totalComments <= 0 ? (
        loading ? (
          <Loader size="15px" style={{ margin: '20px auto' }} />
        ) : (
          <div style={{ marginTop: '8px' }}>
            {widgetStore.realtime && <TypingNotifier writingUsers={writingUsersNumber} />}
            <div>{widgetStore.realtime && <NewCommentsNotifier newCommentsCount={newCommentsCount} />}</div>
            <p style={{ textAlign: 'center' }}>{translation.messages.noComments}</p>
          </div>
        )
      ) : (
        <div>
          <SortingRow active={sortBy} onSelect={commentsStore.changeSorting} />
          {widgetStore.realtime && <TypingNotifier writingUsers={writingUsersNumber} />}
          {widgetStore.realtime && <NewCommentsNotifier newCommentsCount={newCommentsCount} />}
          <div>
            {selectedComment && (
              <Comment
                comment={selectedComment}
                isModerator={isModerator}
                isAuthorized={isAuthorized}
                isRepliedTo={
                  widgetStore.realtime &&
                  typeof writingUsersCommentIDs !== 'undefined' &&
                  writingUsersCommentIDs.indexOf(selectedComment.data.id) > -1
                }
                replyCounts={commentReplyCounts}
                writingUsers={writingUsers}
                writingUsersCommentIDs={writingUsersCommentIDs}
              />
            )}
            {comments.length <= 0 ? (
              loading ? (
                <Loader size="15px" />
              ) : (
                <p style={{ textAlign: 'center' }}>{translation.messages.noCommentsInSorting}</p>
              )
            ) : (
              // {/** Render Comments List, but skip highlighted comment if it exists */}
              comments.map(
                (comment) =>
                  !(selectedComment && comment.data.id === selectedComment.data.id) && (
                    <Comment
                      comment={comment}
                      isModerator={isModerator}
                      isAuthorized={isAuthorized}
                      key={comment.data.id}
                      isRepliedTo={
                        widgetStore.realtime &&
                        typeof writingUsersCommentIDs !== 'undefined' &&
                        writingUsersCommentIDs.indexOf(comment.data.id) > -1
                      }
                      replyCounts={commentReplyCounts}
                      writingUsers={writingUsers}
                      writingUsersCommentIDs={writingUsersCommentIDs}
                    />
                  )
              )
            )}
          </div>
          {moreAvailable && (
            <Button
              onClick={commentsStore.loadMoreComments}
              loading={loading}
              style={{ display: 'block', width: '100%' }}
            >
              {translation.buttons.loadMore /* Load More */}
            </Button>
          )}
        </div>
      )}
    </>
  );
});

export default Comments;
