import Dropdown from '@vuukle/dropdown';
import { Menu } from '@vuukle/menu';
import SocialButton from '@vuukle/social-button';
import * as React from 'react';
import styled from 'styled-components';
import CommentAction from './CommentAction';

export interface IShareActionProps {
  key?: string | number;
  children: string | Element | JSX.Element;
  onClick: (social: 'facebook' | 'twitter' | 'email' | 'whatsapp' | 'link') => void;
}

const SharesWrapper = styled(CommentAction)`
  overflow: visible;
  ${SocialButton}:not(:last-child) {
    margin: ${(props) => (props.theme.isArabic ? '0 0 0 5px' : '0 5px 0 0')};
  }
`;

export const ShareCommentAction: React.FC<IShareActionProps> = ({ onClick, children }) => {
  const renderMenu = () => (
    <Menu style={{ borderRadius: '30px', minWidth: '100px' }}>
      <SocialButton type="facebook" onClick={() => onClick('facebook')} key="facebook" />
      <SocialButton type="twitter" onClick={() => onClick('twitter')} key="twitter" />
      <SocialButton type="whatsapp" onClick={() => onClick('whatsapp')} key="whatsapp" />
      <SocialButton type="email" onClick={() => onClick('email')} key="email" />
      <SocialButton type="link" onClick={() => onClick('link')} key="link" />
    </Menu>
  )

  return (
    <SharesWrapper>
      <Dropdown
        menu={renderMenu()}
        position="top"
      >
        <span className="dropdown-toggle" role="button">
          {children || 'Share'}
        </span>
      </Dropdown>
    </SharesWrapper>
  );
};

export default ShareCommentAction;
