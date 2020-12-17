import uniqueId from 'lodash/uniqueId';
import * as React from 'react';
import { translation } from 'services/translation';

interface IProps {
  id?: string;
  onChange: (e: React.FormEvent<HTMLInputElement>) => void;
  guestSignIn: boolean;
}

const GuestCheckbox: React.FC<IProps> = ({ id = uniqueId('checkbox'), onChange, guestSignIn }) => (
  <div style={{ textAlign: 'right' }}>
    <label htmlFor={id}>
      <input type="checkbox" name="guestSignin" id={id} onChange={onChange} checked={guestSignIn} />
      <span>{translation.messages.guestLogin}</span>
    </label>
  </div>
);

export default GuestCheckbox;
