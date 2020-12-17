import * as React from 'react';
import styled from 'styled-components';

import Alert from '@vuukle/alert';
import Avatar from '@vuukle/avatar';
import Button from '@vuukle/button';
import ProtectedAuth from 'modules/Auth/ProtectedAuth';
import { translation } from 'services/translation';

/** Component Props */
import CommentModel from 'modules/CommentList/store/CommentItem';
import { IAlert } from 'stores/models/Alert';

interface IProps {
  comment: CommentModel;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  alert: IAlert['value'];
  closeAlert: () => void;
  inProgress: boolean;
  closeEditor: () => void;
  children: any;
  authenticatedWithPassword: boolean;
}

const Wrapper = styled.div`
  display: flex;
  flex-direction: row;
  > div:first-child {
    flex: 0 0 40px;
    margin-right: 10px;
  }

  > div:last-child {
    flex: 1 1 100%;
    max-width: calc(100% - 50px);
  }
`;

const EditFormWrapper: React.FC<IProps> = ({ comment, onSubmit, alert, closeAlert, inProgress, closeEditor, children, authenticatedWithPassword }) => {
  /** Renders available actions for users authenticated with password, otherwise we show auth */
  const renderAuthenticatedActions = () => (
    <div style={{ textAlign: 'right' }}>
      <Button
        disabled={inProgress}
        onClick={closeEditor}
        htmlType="button"
        type="subtle"
        style={{ margin: '0 5px' }}
      >
        {translation.common.cancel}
      </Button>
      <Button loading={inProgress} htmlType="submit">
        {translation.common.save}
      </Button>
    </div>
  );

  return (
    <Wrapper>
      <div>
        <Avatar src={comment.data.pictureUrl} name={comment.data.name} hash={comment.data.userId} />
      </div>
      <div>
        <form onSubmit={onSubmit}>
          {children}
          <div style={{ marginTop: '10px' }}>
            {alert && (
              <Alert type={alert.type} onClose={closeAlert}>
                {alert.message}
              </Alert>
            )}
            {/** Render authenticated actions only and only if user has been authorized using password. Otherwise we show protected auth module */}
            {authenticatedWithPassword && renderAuthenticatedActions()}
          </div>
        </form>
        {!authenticatedWithPassword && <ProtectedAuth onClose={closeEditor} />}
      </div>
    </Wrapper>
  );
}

export default EditFormWrapper;
