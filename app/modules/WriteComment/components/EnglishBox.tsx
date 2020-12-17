import { observer } from 'mobx-react';
import React from 'react';

import Tag from '@vuukle/tag';
import TextareaFooter from 'components/TextareaFooter';
import RichEditor from 'modules/RichEditor';
import ToxicityMeter from './ToxicityMeter';

import { mentionsApis } from 'services/apis';
import { translation } from 'services/translation';

/** Component Props */
import EnglishEditBoxStore from 'modules/EditCommentBox/stores/EnglishEditBox';
import EnglishBoxStore from '../stores/EnglishBox';

interface IProps {
  store: EnglishBoxStore | EnglishEditBoxStore;
  authorized: boolean;
  isReply?: boolean;
  name?: string;
}

const WriteCommentBox: React.FC<IProps> = observer((props) => {
  const getMentionsResult = (searchTerm: string) =>
    mentionsApis
      .get(searchTerm)
      .then((matches) =>
        matches.map((match: any) => ({ name: match.name, id: match.userid, avatarUrl: match.pictureurl }))
      )
      .catch(() => []);

  // TODO: mb handle show loading internally
  const onMentionSearch = (searchTerm: string, renderList: any, showLoading: () => void) => {
    if (searchTerm.length >= 3) {
      showLoading();
      getMentionsResult(searchTerm).then((result) => renderList(result, searchTerm));
    }
  };

  /**
   * Handler for RichEditor change
   * @return {void}
   */
  const onEditorChange = (html: string): void => {
    props.store.value = html;
  };

  const { store, authorized } = props;
  return (
    <>
      <RichEditor
        id={store.id}
        value={store.value}
        placeholder={translation.common.writeComment /* Write Comment */}
        disabled={store.inProgress}
        rows={!store.minimized ? 4 : 2}
        showToolbar={!store.minimized}
        onFocus={store.onFocus}
        onBlur={store.onBlur}
        onChange={onEditorChange}
        images={store.images.items}
        imagesAddingDisabled={store.images.inProgress || store.images.uploadLimitExceeded}
        imagesUploadingHidden={!authorized}
        onImageUpload={store.images.upload}
        onImageAdd={store.images.add}
        onImageRemove={store.images.remove}
        onMentionSearch={onMentionSearch}
        key={0}
        isReply={props.isReply}
      />
      <TextareaFooter focused={store.focused} key={1}>
        <div>
          {/* Show toxicity limit only if it's appropriate */}
          <ToxicityMeter
            value={store.toxicityModel.value}
            loading={store.toxicityModel.loading}
            toxicityText={translation.toxicity.long}
            visibilityLimit={store.toxicityModel.limit}
          />
        </div>
        <div>{store.allowedCharactersCount <= 200 && <Tag>{store.allowedCharactersCount}</Tag>}</div>
      </TextareaFooter>
    </>
  );
});

export default WriteCommentBox;
