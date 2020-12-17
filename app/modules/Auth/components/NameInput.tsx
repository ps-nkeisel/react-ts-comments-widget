import * as React from 'react';

import Input from '@vuukle/input';

interface IProps {
  id?: string;
  value: string;
  onChange: (e: React.FormEvent<HTMLInputElement>) => void;
  placeholder: string;
  title: string;
  disabled?: boolean;
  hidden?: boolean;
}

const NameInput: React.FC<IProps> = ({ id, value, placeholder, title, onChange, disabled = false, hidden = false }) => (
  <Input
    type="text"
    value={value}
    pattern={'^[^~`!#$%@^&*+=[\\];,/{}|\\\\":<>?]*$'}
    name="name"
    id={id}
    minLength={3}
    maxLength={40}
    placeholder={placeholder}
    dir="auto"
    title={title}
    onChange={onChange}
    required={true}
    disabled={disabled}
    hidden={hidden}
  />
);

export default NameInput;
