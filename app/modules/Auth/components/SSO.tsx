import React from 'react';

import Button from '@vuukle/button';
import { translation } from 'services/translation';

interface IProps {
  onClick: () => void;
}

const SSOButton: React.FC<IProps> = ({ onClick }) => (
  <div style={{ textAlign: 'right' }}>
    <Button htmlType="button" onClick={onClick}>
      {translation.login.sso}
    </Button>
  </div>
);

export default SSOButton;
