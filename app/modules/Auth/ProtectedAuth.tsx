/**
 * @file Contains protected auth component. This component is used to show authorization module
 * for users that want to perform action that requires password authorization, but user is authenticated
 * without password.
 */
import uniqueId from 'lodash/uniqueId';
import { observer } from 'mobx-react';
import * as React from 'react';
import styled from 'styled-components';

import Alert from '@vuukle/alert';
import Button from '@vuukle/button';
import EmailInput from './components/EmailInput';
import PasswordInput from './components/PasswordInput';
import ResetPasswordLink from './components/ResetPasswordLink';
import StyledForm from './components/StyledForm';

import { translation } from 'services/translation';

/** MobX Stores */
import authStore from 'stores/authStore';
import userStore from 'stores/userStore';

interface IProps {
  /** Action when user wants to close this form */
  onClose: () => void;
  /**
   * Function to call in case of successful user authentication.
   * For example, if we want to fire some action after user successfully authenticated
   * we can use this prop.
   */
  onSuccess?: () => void;
}

const FooterWrapper = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;

  @media (max-width: 500px) {
    flex-direction: column;
    align-items: flex-start;
    > div {
      align-self: flex-end;
    }
  }
`;

const ProtectedAuth: React.FC<IProps> = observer((props) => {
  const id: string = uniqueId('pwd');
  const email = (userStore.details && userStore.details.email) || '';
  const [password, setPassword] = React.useState<string>('');

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();

    // 🔴 Wait for Authentication process end
    await authStore.signIn(email, password);

    // Now, check if authentication has been successful
    if (!authStore.alert.value) {
      setPassword('');
      // Call on success callback
      if (typeof props.onSuccess === 'function') {
        props.onSuccess();
      }
    }
  };

  const { closeAlert, alert, inProgress } = authStore;

  return (
    <StyledForm onSubmit={onSubmit}>
      <div>
        <p>{translation.messages.protectedAction}</p>
        <EmailInput id={id} value={email} disabled={true} placeholder={translation.common.email} />
        <PasswordInput
          id={id}
          value={password}
          minLength={0}
          placeholder={translation.common.password}
          onChange={(e) => setPassword(e.currentTarget.value)}
        />
        {/* Errors Alert */}
        {alert.value && (
          <Alert type="error" onClose={closeAlert}>
            {alert.value.message}
          </Alert>
        )}
        {/* Submit Button */}
        <FooterWrapper>
          <div style={{ margin: '0 5px' }}>
            <ResetPasswordLink />
          </div>
          <div style={{ textAlign: 'right' }}>
            <Button
              disabled={inProgress}
              htmlType="button"
              onClick={props.onClose}
              type="subtle"
              style={{ margin: '0 5px' }}
            >
              {translation.common.cancel}
            </Button>
            <Button loading={inProgress} htmlType="submit">
              {translation.common.signIn}
            </Button>
          </div>
        </FooterWrapper>
      </div>
    </StyledForm>
  );
});

export default ProtectedAuth;
