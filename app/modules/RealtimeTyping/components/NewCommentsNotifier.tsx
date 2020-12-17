import Button from '@vuukle/button';
import commentsStore, { SortingType } from 'modules/CommentList/store';
import React from 'react';
import { translation } from 'services/translation';

import CommentModel from 'modules/CommentList/store/CommentItem';
import RealtimeStore from '../store';
import { observer } from 'mobx-react';

interface IProps {
  newCommentsCount: number;
  loadReplies?: boolean;
  comment?: CommentModel;
}

const NewCommentsNotifier: React.FC<IProps> = observer((props) => {
  if (!(commentsStore.sortBy === SortingType.Latest && props.newCommentsCount > 0)) {
    return null;
  }

  return (
    <Button
      style={props.loadReplies ? {} : { width: '100%' }}
      loading={props.loadReplies ? RealtimeStore.loading : commentsStore.loading}
      type={props.loadReplies ? 'subtle' : 'primary'}
      onClick={() =>
        props.loadReplies && props.comment
          ? commentsStore.loadNewReplies(props.newCommentsCount, props.comment)
          : commentsStore.loadNewComments(props.newCommentsCount)
      }
    >
      {!props.loadReplies
        ? props.newCommentsCount > 1 // if the component is attached to a top-level comment and there are 1 or more new comments
          ? translation.realtime.loadNewMessages.replace('%d', props.newCommentsCount.toString())
          : translation.realtime.loadNewMessage.replace('%d', props.newCommentsCount.toString())
        : props.newCommentsCount > 1 // if the component is attached to a reply and there are 1 or more new comments
        ? `${props.newCommentsCount} new replies`
        : `${props.newCommentsCount} new reply`}
    </Button>
  );
});

export default NewCommentsNotifier;
