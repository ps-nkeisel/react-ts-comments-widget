import Avatar from '@vuukle/avatar';
import React from 'react';
import styled from 'styled-components';

const Wrapper = styled.div`
  display: flex;
  justify-content: flex-start;
  align-items: center;

  ${Avatar} {
    margin-right: 12px;
  }

  p {
    color: ${(props) => props.theme.mutedColor};
  }
`;

interface IProps {
  message: string;
}

const HiddenComment: React.FC<IProps> = ({ message }) => (
  <Wrapper>
    <Avatar name="?" />
    <div>
      <p>{message}</p>
    </div>
  </Wrapper>
);

export default HiddenComment;
