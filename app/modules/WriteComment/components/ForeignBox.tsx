import { observer } from 'mobx-react';
import * as React from 'react';

import Button from '@vuukle/button';
import Tag from '@vuukle/tag';
import { translation } from 'services/translation';

import TextareaFooter from 'components/TextareaFooter';
import Textarea from './Textarea';

/** Props */
import ForeignEditStore from 'modules/EditCommentBox/stores/ForeignEditBox';
import ForeignStore from '../stores/ForeignBox';
import TransliterationStore, { Transliteration } from '../stores/models/Transliteration';

interface IProps {
  store: ForeignStore | ForeignEditStore;
  isReply?: boolean;
  name?: string;
}

const ForeignBox: React.FC<IProps> = observer((props) => {
  const transliterationStore: Transliteration = TransliterationStore;

  // Just to make the Tag counter update
  const onTextChange = (e: any): void => {
    props.store.value = e.target.value;
  };

  React.useEffect(() => {
    /** 🇮🇳 🇺🇦 🇵🇱 Enabled transliteration for current component textarea */
    transliterationStore.toggleBox(props.store.id);
    /** Set value of the comment box if needed */
    const textarea = document.querySelector(`#${props.store.id}`);
    if (textarea instanceof HTMLTextAreaElement) {
      textarea.value = props.store.value;
    }

    return () => {
      /** 🔴 Remove textarea on component unmount */
      transliterationStore.toggleBox(props.store.id);
    };
  }, []);

  return (
    <div>
      <Textarea
        id={props.store.id}
        disabled={props.store.inProgress}
        rows={props.store.minimized ? 2 : 4}
        minRows={props.store.minimized ? 2 : 4}
        maxRows={10}
        onFocus={props.store.onFocus}
        onBlur={props.store.onBlur}
        onChange={(e: any) => onTextChange(e)}
        placeholder={
          props.isReply
            ? +translation.common.replyingTo + ' @' + props.name
            : translation.common.writeComment /* Write Comment */
        }
        required={true}
        key={0}
      />
      <TextareaFooter focused={false} key={1}>
        <div>
          {!props.store.hideToggleButton && (
            <Button
              onClick={transliterationStore.toggleLanguage}
              style={{ padding: '0 6px', lineHeight: 1.2, marginRight: '5px', textTransform: 'capitalize' }}
              type="subtle"
              sm={true}
            >
              {transliterationStore.language}
            </Button>
          )}
        </div>
        <div>{props.store.allowedCharactersCount <= 200 && <Tag>{props.store.allowedCharactersCount}</Tag>}</div>
      </TextareaFooter>
    </div>
  );
});

export default ForeignBox;
