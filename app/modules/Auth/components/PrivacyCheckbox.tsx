import uniqueId from 'lodash/uniqueId';
import * as React from 'react';

interface IProps {
  id?: string;
  checkboxText: string;
  privacyPolicyLink: string;
  privacyPolicyLinkText: string;
  checkboxStyles?: React.CSSProperties;
}

const PrivacyCheckbox: React.FC<IProps> = ({
  id = uniqueId('checkbox'),
  checkboxText,
  checkboxStyles,
  privacyPolicyLink,
  privacyPolicyLinkText,
}) => (
  <div style={{ textAlign: 'right' }}>
    <label htmlFor={id}>
      <input type="checkbox" id={id} name="terms" style={checkboxStyles || {}} required={true} />
      <span>
        {checkboxText}{' '}
        <a href={privacyPolicyLink} target="_blank" rel="noopener nofollow">
          {privacyPolicyLinkText}
        </a>
      </span>
    </label>
  </div>
);

export default PrivacyCheckbox;
