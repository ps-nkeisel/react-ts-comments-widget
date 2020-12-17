import React from 'react';
import styled from 'styled-components';

interface IProps {
  /** Image url */
  image: string;
  /** On click action */
  onClick: () => void;
}

const Image = styled.img`
  height: 100%;
  width: 100%;
  object-fit: cover;
`;

const GifWrapper = styled.div`
  margin-bottom: 5px;
  width: 49%;
  overflow: hidden;
  cursor: pointer;
  &:hover {
    background: black;
  }
  &:hover ${Image} {
    opacity: 0.9;
  }
`;

const GifItem: React.FC<IProps> = ({ image, onClick }: IProps) => (
  <GifWrapper onClick={onClick}>
    <Image src={image} />
  </GifWrapper>
);

export default GifItem;
