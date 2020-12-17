import * as React from 'react';
import styled from 'styled-components';

import Avatar from '@vuukle/avatar';
import Dropdown from '@vuukle/dropdown';
import Icon from '@vuukle/icon';
import { Menu } from '@vuukle/menu';
import Tag from '@vuukle/tag';
import { translation } from 'services/translation';

interface IProps {
  profile: User;
  signOut?: () => void | undefined;
  showComments?: () => void;
  hideProfile?: boolean;
  hideShowComments?: boolean;
  hideSettings?: boolean;
}

const StyledDropDown = styled((props) => <Dropdown {...props} />)`
  .v-menu {
    ${(props) => (props.theme.isArabic ? 'right: 0; left: auto;' : 'left: 0; right: auto;')};
  }
`;

/**
 * @name ProfileRow
 * This component used to show profile dropdown below write comment box.
 * @render React
 */
const ProfileRow: React.FC<IProps> = ({
  profile,
  showComments,
  signOut,
  hideProfile,
  hideShowComments,
  hideSettings,
}) => {
  const renderMenu = () => (
    <Menu>
      {!hideProfile ? <Menu.Item href={`https://news.vuukle.com/profile/${profile.id}`} target="_blank">{translation.profile.myProfile}</Menu.Item> : ''}
      {!hideShowComments ? <Menu.Item onClick={showComments}>{translation.profile.myComments}</Menu.Item> : ''}
      {!hideSettings ? <Menu.Item href="https://news.vuukle.com/settings/account">{translation.profile.settings}</Menu.Item> : ''}
      {signOut && <Menu.Item onClick={signOut}>{translation.profile.signOut}</Menu.Item>}
    </Menu>
  )

  return (
    <div style={{ marginBottom: '10px' }}>
      <StyledDropDown
        menu={renderMenu()}
      >
        <a href="#no" style={{ outline: 'none', boxShadow: 'none' }}>
          <Avatar name={profile.name} src={profile.avatar} hash={profile.id} /> <span>{profile.name}</span>
          {profile.isModerator && (
            <Tag type="warning" style={{ margin: '0 3px' }}>
              {translation.common.moderator}
            </Tag>
          )}
          <Icon type="caret" />
        </a>
      </StyledDropDown>
    </div>
  );
};

export default ProfileRow;
