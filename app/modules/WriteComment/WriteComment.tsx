import { inject, observer } from 'mobx-react';
import * as React from 'react';

import CommentStoreModel from 'modules/CommentList/store/CommentItem';
import deviceInfo from 'services/deviceInfo';

import EnglishBox from './components/EnglishBox';
import ForeignBox from './components/ForeignBox';

import EnglishBoxStore from './stores/EnglishBox';
import ForeignBoxStore from './stores/ForeignBox';

import FormWrapper from './components/FormWrapper';

/** MobX stores */
import userStore from 'stores/userStore';
import widgetStore from 'stores/widgetStore';

interface IProps {
  /**
   * Add comment callback.
   * In general this prop is just a function which is used to add comment to the needed place in the store
   */
  addComment: (comment: Comments.ServerComment) => void;
  /**
   * It's id of the parent comment. Needed if we put reply box.
   * Use 0 for comment action (comment that appears as main in feed) and real `parentId` for an reply action
   */
  parentId: number;
  /**
   * Comment edit mode
   * @default false
   */
  editComment?: CommentStoreModel;
  name?: string;
}

/**
 * @name HOCDecision
 * Decides which editor to show for user based on language publisher selected.
 * For english we show one editor and for non-english another with a transliteration plugin.
 * @render React
 * Main comment box:
 * @example <HOCDecision />
 * Reply box:
 * @example <HOCDecision addComment={(comment) => console.log('Comment has been added:', comment)} parentId={1} />}
 */

const HOCDecision: React.FC<IProps> = observer((props) => {
  const [store, setStore] = React.useState<EnglishBoxStore | ForeignBoxStore>();

  React.useEffect(() => {
    widgetStore.language !== 'en' || deviceInfo.browserName === 'IE'
      ? setStore(new ForeignBoxStore(props.parentId, props.addComment))
      : setStore(new EnglishBoxStore(props.parentId, props.addComment));
  }, []);

  const isReply: boolean = props.parentId !== 0;

  const baseProps = {
    isReply,
    name: props.name || '',
  };

  if ((store && store.hidden) || !store) {
    return null;
  }

  return (
    <FormWrapper
      handleSubmit={store && store.onSubmit}
      id={store.id}
      inProgress={store.inProgress}
      alert={store.alert.value}
      closeAlert={store.alert.close}
      expand={() => (store.collapsed = false)}
      isCollapsed={store.collapsed}
      isReply={props.parentId !== 0}
      isDisabled={store.disabled}
      isClicked={!store.minimized}
    >
      {store instanceof ForeignBoxStore ? (
        <ForeignBox store={store} {...baseProps} />
      ) : (
        <EnglishBox {...baseProps} store={store} authorized={userStore.isAuthorized} />
      )}
    </FormWrapper>
  );
});

export default inject('widgetStore', 'userStore')(HOCDecision);
