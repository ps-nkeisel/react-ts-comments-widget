import Button from '@vuukle/button';
import Dropdown, { DropdownProps, IDropDownItem } from '@vuukle/dropdown';
import Icon from '@vuukle/icon';
import { Menu } from '@vuukle/menu';
import * as React from 'react';
import styled from 'styled-components';

interface IProps {
  options: IDropDownItem[];
  style?: React.CSSProperties;
}

const StyledDropDown = styled(Dropdown)<DropdownProps>`
  .v-menu {
    ${(props) => (props.theme.isArabic ? 'left: 0; right: auto;' : 'right: 0; left: auto;')};
  }
`;

const DropdownMore: React.FC<IProps> = ({ options, style }) => {
  const renderMenu = () => (
    <Menu style={{ minWidth: '160px' }}>
      {options.map((option) => (
        <Menu.Item onClick={option.onClick} key={option.name}>
          {option.name}
        </Menu.Item>
      ))}
    </Menu>
  )

  return (
    <StyledDropDown
      style={style}
      position="top"
      menu={renderMenu()}
    >
      <Button type="subtle" className="dropdown-toggle" sm={true}>
        <Icon type="more-vertical" size="20px" style={{ transform: 'rotate(90deg)' }} />
      </Button>
    </StyledDropDown>
  );
};

export default DropdownMore;
