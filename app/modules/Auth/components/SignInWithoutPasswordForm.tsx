import React from 'react';

import Alert from '@vuukle/alert';
import Button from '@vuukle/button';
import { translation } from 'services/translation';
import EmailInput from './EmailInput';
import NameInput from './NameInput';
import PrivacyCheckbox from './PrivacyCheckbox';
import StyledForm from './StyledForm';

import widgetStore from 'stores/widgetStore';

interface IProps {
  name: string;
  email: string;
  loading: boolean;
  onInputChange: (e: React.FormEvent<HTMLInputElement>) => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  errorMessage?: string | null;
  onAlertClose: () => void;
}

const SignInWithoutPasswordForm: React.FC<IProps> = ({
  name,
  email,
  loading,
  onInputChange,
  onSubmit,
  onAlertClose,
  errorMessage,
}) => {
  const isCustomCheckboxProvided = widgetStore.privacy.checkboxText && widgetStore.privacy.privacyPolicyLink;
  return (
    <StyledForm onSubmit={onSubmit} action="#">
      <NameInput
        value={name}
        onChange={onInputChange}
        placeholder={translation.common.name}
        title={translation.common.invalidName}
      />
      <EmailInput value={email} onChange={onInputChange} placeholder={translation.common.email} />
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
      {/* Errors Alert */}
      {errorMessage && (
        <Alert type="error" onClose={onAlertClose}>
          {errorMessage}
        </Alert>
      )}
      {/* Submit Button */}
      <div style={{ textAlign: 'right' }}>
        <Button loading={loading} htmlType="submit">
          {translation.common.signIn}
        </Button>
      </div>
    </StyledForm>
  );
};

export default SignInWithoutPasswordForm;
