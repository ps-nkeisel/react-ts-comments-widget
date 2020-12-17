import React from 'react';

import Button from '@vuukle/button';
import { translation } from 'services/translation';
import EmailInput from './EmailInput';
import NameInput from './NameInput';
import StyledForm from './StyledForm';

interface IProps {
  name: string;
  email: string;
  loading: boolean;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
}

const SignInAnonForm: React.FC<IProps> = ({ loading, onSubmit, name, email }) => (
  <StyledForm onSubmit={onSubmit} action="#">
    <NameInput
      value={name}
      onChange={() => null}
      placeholder={translation.common.name}
      title={translation.common.invalidName}
      disabled={true}
      hidden={true}
    />
    <EmailInput value={email} placeholder={translation.common.email} disabled={true} hidden={true} />
    {/* Submit Button */}
    <div style={{ textAlign: 'right' }}>
      <Button loading={loading} htmlType="submit">
        {translation.common.signIn}
      </Button>
    </div>
  </StyledForm>
);

export default SignInAnonForm;
