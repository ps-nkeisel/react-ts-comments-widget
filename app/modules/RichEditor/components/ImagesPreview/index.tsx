import { observer } from 'mobx-react';
import React from 'react';
import Image from './Image';

interface IProps {
  /** Image remove action */
  items: string[];
  /** Function to remove entity */
  onRemove: (url: string) => void;
}

/**
 * Renders added images to comment
 */
export const ImagesPreview: React.FC<IProps> = observer(({ onRemove, items }) => {
  return (
    <div>
      {items.map((url: string) => (
        <Image onRemove={onRemove} key={url} url={url} />
      ))}
    </div>
  );
});

export default ImagesPreview;
