import { observer } from 'mobx-react';
import React from 'react';
import styled, { keyframes } from 'styled-components';

import Avatar from '@vuukle/avatar';

const Wrapper = styled.div`
  display: inline-flex;
  justify-content: flex-start;
  align-items: center;
  margin-top: 8px;
  ${Avatar} {
    filter: contrast(0.9);
  }
`;

const ArrowBox = styled.div`
  display: flex;
  transition: 0.5s all;
  width: 53px;
  height: 30px;
  background: #edeef0;
  position: relative;
  margin-left: 12px;
  border-radius: 10px;
  justify-content: center;
  &:before {
    content: '';
    position: absolute;
    right: 100%;
    top: 9px;
    width: 0;
    height: 0;
    border-top: 5px solid transparent;
    border-right: 10px solid #edeef0;
    border-bottom: 5px solid transparent;
  }
`;

const bounce = keyframes`
  0%, 80%, 100% {
    transform: scale(0);
  } 40% {
    transform: scale(1.0);
  }
`;

const ThreeDots = styled.div`
  display: flex;
  align-self: center;
  > div {
    &:not(:first-child) {
      margin-left: 2px;
    }
    width: 10px;
    height: 10px;
    background-color: ${(props) => props.theme.mutedColor};
    border-radius: 100%;
    animation: ${bounce} 1.4s infinite ease-in-out both;

    &:nth-child(1) {
      animation-delay: -0.32s;
    }

    &:nth-child(2) {
      animation-delay: -0.16s;
    }
  }
`;

const TypingDemonstration = observer((props: { writingUsers: number }) => (
  <Wrapper>
    {/* Current user is automatically excluded in setter */}
    {/** Don't worry about that hash, it's just for making a long string that will influence color choice of Avatar */}
    {props.writingUsers > 0 && (
      <>
        <Avatar
          name={`${props.writingUsers}`}
          hash={(props.writingUsers * (Math.random() * (Math.random() * 1000))).toPrecision(16).toString()}
          size="40px"
        />
        <ArrowBox>
          <ThreeDots>
            <div />
            <div />
            <div />
          </ThreeDots>
        </ArrowBox>
      </>
    )}
  </Wrapper>
));

export default TypingDemonstration;
