import React from 'react';
import { translation } from 'services/translation';

const ResetPasswordLink = () => (
  <span>
    {translation.messages.missingPassword}{' '}
    <a href="https://news.vuukle.com/forgot-password" target="_blank" rel="noopener nofollow">
      {translation.messages.passwordReset}
    </a>
  </span>
);

export default ResetPasswordLink;
