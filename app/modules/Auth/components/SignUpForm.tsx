import React from 'react';

import Alert from '@vuukle/alert';
import Button from '@vuukle/button';

import EmailInput from './EmailInput';
import NameInput from './NameInput';
import PasswordInput from './PasswordInput';
import PrivacyCheckbox from './PrivacyCheckbox';
import StyledForm from './StyledForm';

import { translation } from 'services/translation';

interface IProps {
  email: string;
  name: string;
  password: string;
  loading: boolean;
  onInputChange: (e: React.FormEvent<HTMLInputElement>) => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  onFormToggleClick: () => void;
  errorMessage?: string | null;
  onAlertClose: () => void;
}

const SignUpForm: React.FC<IProps> = ({
  name,
  email,
  password,
  onInputChange,
  onSubmit,
  onFormToggleClick,
  onAlertClose,
  errorMessage,
  loading,
}) => (
  <StyledForm onSubmit={onSubmit}>
    <NameInput
      value={name}
      onChange={onInputChange}
      placeholder={translation.common.name}
      title={translation.common.invalidName}
    />
    <EmailInput value={email} onChange={onInputChange} placeholder={translation.common.email} />
    <PasswordInput value={password} onChange={onInputChange} placeholder={translation.common.password} />
    <PrivacyCheckbox
      checkboxText={translation.common.agreeWithVuukle}
      privacyPolicyLink="https://docs.vuukle.com/privacy-and-policy/"
      privacyPolicyLinkText={translation.common.privacyPolicy}
    />
    {/* Errors Alert */}
    {errorMessage && (
      <Alert type="error" onClose={onAlertClose}>
        {errorMessage}
      </Alert>
    )}
    {/* Submit Button */}
    <div style={{ textAlign: 'right' }}>
      <span style={{ margin: '0 5px' }}>
        {translation.messages.signInQuestion}{' '}
        <a href="#" onClick={onFormToggleClick}>
          {translation.common.signIn}
        </a>
      </span>
      <Button loading={loading} htmlType="submit">
        {translation.common.signUp}
      </Button>
    </div>
  </StyledForm>
);

export default SignUpForm;
