import uniqueId from 'lodash/uniqueId';
import * as React from 'react';
import styled from 'styled-components';

import { ToolbarLabel } from './ToolbarButton';
import UploadImageIcon from './UploadImageIcon';

interface IProps {
  className?: string;
  onFileInputChange: (e: any) => void;
  disabled?: boolean;
}

const UploadButton = ({ className, onFileInputChange, disabled }: IProps) => {
  const id = uniqueId('upload_');
  return (
    <div className={className}>
      <ToolbarLabel htmlFor={id} style={{ margin: '0 5px' }} disabled={disabled}>
        <UploadImageIcon />
      </ToolbarLabel>
      <input
        type="file"
        name={id}
        accept=".png,.jpg,.jpeg,.bmp,.gif"
        id={id}
        onChange={onFileInputChange}
        disabled={disabled}
      />
    </div>
  );
};

const StyledUploadButton = styled(UploadButton)`
  position: relative;
  overflow: hidden;

  input[type='file'] {
    font-size: 100px;
    position: absolute;
    left: 0;
    top: 0;
    opacity: 0;
    visibility: hidden;
    cursor: pointer;
  }
`;

export default StyledUploadButton;
