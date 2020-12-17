import React from 'react';
import { articleSearch, reportEvent } from 'services/communication/sendEvents';
import { translation } from 'services/translation';
import SearchIcon from './SearchIcon';

import Input from '@vuukle/input';
import styled from 'styled-components';

const StyledInput = styled(Input)`
  position: absolute;
  max-width: 100%;
  padding-left: 30px;
`;

const Wrapper = styled.div`
  display: inline-block;
  margin: 10px 0 20px;
`;

const SearchInput: React.FC = () => {
  const [value, setValue] = React.useState<string>('');

  const setSearchValue = (e: React.FormEvent<HTMLInputElement>) => {
    if (e.currentTarget.value.length <= 100) {
      setValue(e.currentTarget.value);
    }
  };

  const keyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.keyCode === 13 && value.length >= 3) {
      articleSearch(decodeURIComponent(value));
      reportEvent('search');
    }
  };

  return (
    <Wrapper>
      <StyledInput
        type="text"
        value={value}
        onChange={setSearchValue}
        onKeyDown={keyDown}
        placeholder={translation.searchComments}
      />
      <SearchIcon />
    </Wrapper>
  );
}
export default SearchInput;
