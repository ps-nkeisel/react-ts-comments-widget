import React from 'react';

import { translation } from 'services/translation';

import Alert from '@vuukle/alert';
import Button from '@vuukle/button';

import EmailInput from './EmailInput';
import PasswordInput from './PasswordInput';
import StyledForm from './StyledForm';
import ResetPasswordLink from './ResetPasswordLink';
import NameInput from './NameInput';
import GuestCheckbox from './GuestCheckbox';
import PrivacyCheckbox from './PrivacyCheckbox';

import widgetStore from 'stores/widgetStore';

interface IProps {
  email: string;
  name: string;
  password: string;
  loading: boolean;
  signInAsGuest: boolean;
  onInputChange: (e: React.FormEvent<HTMLInputElement>) => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  onFormToggleClick: () => void;
  errorMessage?: string | null;
  onAlertClose: () => void;
}

const PasswordAndGuestForm: React.FC<IProps> = ({
  email,
  password,
  name,
  loading,
  signInAsGuest,
  onInputChange,
  onSubmit,
  errorMessage,
  onAlertClose,
  onFormToggleClick,
}) => {
  const isCustomCheckboxProvided = widgetStore.privacy.checkboxText && widgetStore.privacy.privacyPolicyLink;
  return (
    <StyledForm onSubmit={onSubmit}>
      {signInAsGuest && (
        <NameInput
          value={name}
          onChange={onInputChange}
          placeholder={translation.common.name}
          title={translation.common.invalidName}
        />
      )}
      <EmailInput value={email} onChange={onInputChange} placeholder={translation.common.email} />
      {!signInAsGuest && (
        <PasswordInput value={password} onChange={onInputChange} placeholder={translation.common.password} />
      )}
      <PrivacyCheckbox
        checkboxText={translation.common.agreeWithVuukle}
        privacyPolicyLink="https://docs.vuukle.com/privacy-and-policy/"
        privacyPolicyLinkText={translation.common.privacyPolicy}
      />
      {isCustomCheckboxProvided && (
        <PrivacyCheckbox
          checkboxText={widgetStore.privacy.checkboxText}
          privacyPolicyLink={widgetStore.privacy.privacyPolicyLink}
          privacyPolicyLinkText={widgetStore.privacy.privacyPolicyLinkText || translation.common.privacyPolicy}
        />
      )}
      {!signInAsGuest && (
        <>
          <div style={{ textAlign: 'right' }}>
            <ResetPasswordLink />
          </div>
        </>
      )}
      {/* Errors Alert */}
      {errorMessage && (
        <Alert type="error" onClose={onAlertClose}>
          {errorMessage}
        </Alert>
      )}
      {/* Submit Button */}
      <div style={{ textAlign: 'right' }}>
        {!signInAsGuest && (
          <span style={{ margin: '0 5px' }}>
            {translation.messages.signUpQuestion}{' '}
            <a href="#no" onClick={onFormToggleClick}>
              {translation.common.signUp}
            </a>
          </span>
        )}
        <Button loading={loading} htmlType="submit">
          {translation.common.signIn}
        </Button>
      </div>
      <GuestCheckbox onChange={onInputChange} guestSignIn={signInAsGuest} />
    </StyledForm>
  );
};

export default PasswordAndGuestForm;
