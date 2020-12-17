import * as React from 'react';

import Input from '@vuukle/input';

interface IProps {
  id?: string;
  value: string;
  onChange: (e: React.FormEvent<HTMLInputElement>) => void;
  placeholder: string;
  minLength?: number;
}

const PasswordInput: React.FC<IProps> = ({ id, value, placeholder, onChange, minLength = 5 }) => (
  <Input
    type="password"
    name="password"
    id={id}
    placeholder={placeholder}
    minLength={minLength}
    value={value}
    maxLength={32}
    onChange={onChange}
    required={true}
  />
);

export default PasswordInput;
