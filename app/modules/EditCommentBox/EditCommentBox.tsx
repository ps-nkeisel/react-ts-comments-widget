import { observer } from 'mobx-react';
import * as React from 'react';
import deviceInfo from 'services/deviceInfo';

import EditFormWrapper from './components/EditFormWrapper';

import EnglishBox from 'modules/WriteComment/components/EnglishBox';
import ForeignBox from 'modules/WriteComment/components/ForeignBox';

import EnglishBoxStore from './stores/EnglishEditBox';
import ForeignBoxStore from './stores/ForeignEditBox';

/** MobX Stores */
import userStore from 'stores/userStore';
import widgetStore from 'stores/widgetStore';

/** Component Props */
import Comment from 'modules/CommentList/store/CommentItem';
interface IProps {
  /** Used for self closing. For example when user wants to cancel editing */
  onClose: () => void;
  comment: Comment;
}

const EditCommentBox: React.FC<IProps> = observer((props) => {
  const { comment } = props;

  const [store, setStore] = React.useState<EnglishBoxStore | ForeignBoxStore>();

  React.useEffect(() => {
    widgetStore.language === 'en' && deviceInfo.browserName !== 'IE'
      ? // Show english box for english lang and not IE browser
        setStore(new EnglishBoxStore(comment.data.id, comment.data.commentText, comment.editComment))
      : // Show Foreign store for non-english language widget or IE browser
        setStore(new ForeignBoxStore(comment.data.id, comment.data.commentText, comment.editComment));
  }, []);

  if (!store) {
    return null;
  }

  return (
    <EditFormWrapper
      comment={comment}
      onSubmit={store.onSubmit}
      alert={store.alert.value}
      closeAlert={store.alert.close}
      inProgress={store.inProgress}
      closeEditor={props.onClose}
      authenticatedWithPassword={(userStore.details && userStore.details.isPasswordEntered) || false}
    >
      {store instanceof EnglishBoxStore ? (
        <EnglishBox store={store} authorized={userStore.isAuthorized} />
      ) : (
        <ForeignBox store={store} />
      )}
    </EditFormWrapper>
  );
});

export default EditCommentBox;
