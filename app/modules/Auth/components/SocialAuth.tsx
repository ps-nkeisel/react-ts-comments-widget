import * as React from 'react';
import styled from 'styled-components';

import SocialButton from '@vuukle/social-button';

import { translation } from 'services/translation';

/** Component Props */
interface IProps {
  /** Show/Hide Facebook auth */
  facebook: boolean;
  /** Show/Hide Google auth */
  google: boolean;
  /** Show/Hide Twitter auth */
  twitter: boolean;
  /** Show/Hide Twitter auth */
  disqus: boolean;

  onClick: (social: 'facebook' | 'google' | 'twitter' | 'disqus') => void;
}

const SocialAuthWrapper = styled.div`
  margin-right: 10px;
  > button {
    margin-left: 5px;
  }
`;

const SocialAuth: React.FC<IProps> = ({ onClick, disqus, facebook, google, twitter }) => (
  <SocialAuthWrapper>
    {facebook && (
      <SocialButton onClick={() => onClick('facebook')} type="facebook" size="35px" title={translation.login.facebook} />
    )}
    {google && (
      <SocialButton onClick={() => onClick('google')} type="google" size="35px" title={translation.login.google} />
    )}
    {twitter && (
      <SocialButton onClick={() => onClick('twitter')} type="twitter" size="35px" title={translation.login.twitter} />
    )}
    {disqus && (
      <SocialButton onClick={() => onClick('disqus')} type="disqus" size="35px" title={translation.login.disqus} />
    )}
  </SocialAuthWrapper>
);

export default SocialAuth;
