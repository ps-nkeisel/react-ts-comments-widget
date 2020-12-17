import * as React from 'react';
import styled from 'styled-components';

import Dropdown from '@vuukle/dropdown';
import Icon from '@vuukle/icon';
import { Menu } from '@vuukle/menu';
import { translation } from 'services/translation';

interface IProps {
  active: string;
  onSelect: (active: string) => void;

  className?: string;
}

const Wrapper = styled.div`
  margin: 10px 0;
  margin-bottom: 0;
  padding: 5px;
  border-bottom: 0.05rem solid ${(props) => (props.theme.isDark ? '#757575' : '#e7e9ed')};
  a {
    font-weight: 600;
    margin: 0px 0.4rem 0px 0px;
    padding: 0.4rem 0.3rem;
    text-decoration: none;
    color: ${(props) => props.theme.textColor};
    &:hover,
    &:active,
    &:focus {
      text-decoration: none;
      color: ${(props) => props.theme.primaryColor};
    }
  }
`;

const SortingRow: React.FC<IProps> = ({ active, className, onSelect }) => {
  /** Keep it here so it gets updated */
  const sortByKey = {
    get_latest: translation.sorting.latest,
    get_most_replied: translation.sorting.mostReplied,
    get_most_up_votes: translation.sorting.mostLiked,
    get_reverse_chrono: translation.sorting.oldest,
  };

  const renderMenu = () => (
    <Menu>
      {Object.keys(sortByKey).map((key) => (
        <Menu.Item key={key} active={active === key}
          onClick={() => onSelect(key)}
        >
          {sortByKey[key]}
        </Menu.Item>
      ))}
    </Menu>
  )

  return (
    <Wrapper className={className}>
      <Dropdown
        align="left"
        menu={renderMenu()}
      >
        <a href="#">
          {translation.sorting.sortBy} {sortByKey[active]} <Icon type="caret" />
        </a>
      </Dropdown>
    </Wrapper>
  );
};

export default SortingRow;
