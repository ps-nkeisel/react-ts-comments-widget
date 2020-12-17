import React from 'react';
import { translation } from 'services/translation';
import styled from 'styled-components';

import Link from '@vuukle/link';

const EntityItem = styled.div`
  display: inline-block;
  max-width: 300px;
  padding: 10px;
  text-align: center;
`;

interface IProps {
  /** Image remove action */
  onRemove: (url: string) => void;
  /** Image url to display */
  url: string;
}

/**
 * Renders added comment image
 */
export function ImageEntity({ onRemove, url }: IProps) {
  return (
    <EntityItem>
      <img src={url} style={{ width: '100%', height: 'auto' }} alt="Comment image" />
      <div>
        <Link light={true} onClick={() => onRemove(url)}>
          {translation.common.remove}
        </Link>
      </div>
    </EntityItem>
  );
}

export default ImageEntity;
