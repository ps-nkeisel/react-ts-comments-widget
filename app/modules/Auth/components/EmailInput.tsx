import * as React from 'react';

import Input from '@vuukle/input';

interface IProps {
  id?: string;
  value: string;
  onChange?: (e: React.FormEvent<HTMLInputElement>) => void;
  placeholder: string;
  disabled?: boolean;
  hidden?: boolean;
}

const EmailInput: React.FC<IProps> = ({ id, value, onChange, placeholder, hidden = false, disabled = false }) => (
  <Input
    type="email"
    value={value}
    placeholder={placeholder}
    dir="auto"
    name="email"
    id={id}
    onChange={onChange}
    required={true}
    disabled={disabled}
    hidden={hidden}
  />
);

export default EmailInput;
