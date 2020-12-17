import React from 'react';
import Avatar from '@vuukle/avatar';

interface IProps {
  name: string;
  id: string;
  avatarUrl: string | null;
  isActive: boolean;
  onMouseEnter: (id: string) => void;
  onSelect: (id: string) => void;
}

const MentionListItem: React.FC<IProps> = ({ name, id, avatarUrl, onMouseEnter, onSelect, isActive, ...props }) => {
  let className = 'ql-mention-list-item';
  if (isActive) {
    className += ' selected';
  }

  return (
    <li {...props} className={className} onMouseEnter={() => onMouseEnter(id)} onClick={() => onSelect(id)}>
      <Avatar src={avatarUrl} name={name} hash={id} size="32px" />
      <span>{name}</span>
    </li>
  );
};

export default MentionListItem;
