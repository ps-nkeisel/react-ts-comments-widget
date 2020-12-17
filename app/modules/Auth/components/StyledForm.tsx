import styled from 'styled-components';

export default styled.form`
  input[type='text'],
  input[type='email'],
  input[type='password'],
  > div {
    display: block;
    margin-bottom: 10px;
  }
  input[type='checkbox'] {
    margin: 0 5px;
    vertical-align: middle;
  }
  input[hidden] {
    display: none !important;
  }
`;
