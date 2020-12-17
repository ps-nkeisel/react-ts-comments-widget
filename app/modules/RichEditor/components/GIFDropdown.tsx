import React from 'react';
import styled from 'styled-components';

import { Menu } from '@vuukle/menu';
import GIFPicker from 'modules/GifPicker';
import GIFIcon from './GIFIcon';
import { ToolbarButton } from './ToolbarButton';

interface IProps {
  onSelect: (GIFUrl: string) => void;
  disabled?: boolean;
}

const Wrapper = styled.div`
  position: relative;
  .menu {
    position: absolute;
    left: 0;
    top: 20px;
    width: 350px;
    padding: 10px;
  }
`;

const GIFDropdown: React.FC<IProps> = ( props ) => {
  const wrapperRef: React.RefObject<any> = React.useRef();
  const [displayMenu, setDisplayMenu] = React.useState<boolean>(false);

  const showMenu = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    setDisplayMenu(true);
    document.addEventListener('click', hideMenu)
  };

  const hideMenu = (event: React.MouseEvent<HTMLButtonElement> | MouseEvent): void => {
    const button = wrapperRef.current.querySelector('button');
    if (
      (wrapperRef.current && !wrapperRef.current.contains(event.target)) ||
      (button && button.contains(event.target))
    ) {
      setDisplayMenu(false);
      document.removeEventListener('click', hideMenu)
    }
  };

  /** Render Dropdown Menu once it's opened */
  const renderMenu = () => (
    <Menu className="menu">
      <GIFPicker
        onSelect={(GIFLink) => {
          setDisplayMenu(false);
          props.onSelect(GIFLink);
        }}
      />
    </Menu>
  );

  return (
    <Wrapper ref={wrapperRef}>
      <ToolbarButton type="button" onClick={showMenu} disabled={props.disabled}>
        <GIFIcon />
      </ToolbarButton>

      {/** GIF picker component */}
      {displayMenu && renderMenu()}
    </Wrapper>
  );
}

export default GIFDropdown;
