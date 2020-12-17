import * as React from 'react';
import styled from 'styled-components';

import { IFormattingOption } from 'modules/RichEditor/utils';
import GIFDropdown from './GIFDropdown';
import { ToolbarButton } from './ToolbarButton';
import UploadImageButton from './UploadImageButton';

interface IProps {
  id: string;
  hidden: boolean;
  options: IFormattingOption[];

  onImageAdd: (image: string) => void;
  onImageUpload: (file: File) => void;
  imagesAddingDisabled: boolean;
  imagesUploadingHidden: boolean;
}

const Wrapper = styled.div`
  display: flex;
  justify-content: flex-start;
  flex-direction: row;
  height: 30px;
  background: ${(props) => props.theme.input.background};
  padding: 0 4px;
  border: 0;
  border-top: 1px dashed ${(props) => props.theme.input.border};
  align-items: center;
`;

const Toolbar: React.FC<IProps> = ( props ) => {
  /** Conditionally return JSX for toolbar based on type. Image and GIF need to be handled differently */
  const renderOption = ({ type, icon, className, title }: IFormattingOption, index: number) => {
    if (type === 'image') {
      return (
        !props.imagesUploadingHidden && (
          <UploadImageButton onFileInputChange={onUploadChange} disabled={props.imagesAddingDisabled} />
        )
      );
    } else if (type === 'gif') {
      return <GIFDropdown key={index} onSelect={props.onImageAdd} disabled={props.imagesAddingDisabled} />;
    } else {
      return (
        <ToolbarButton
          key={type}
          type="button"
          className={className}
          title={title}
          dangerouslySetInnerHTML={{ __html: icon }}
        />
      );
    }
  };

  /** Handler for image upload button */
  const onUploadChange = (e: any) => {
    const files = Array.from(e.target.files);
    if (files[0] instanceof File) {
      props.onImageUpload(files[0] as File);
    }
  };

  const { children, id, hidden, options } = props;

  return (
    <Wrapper className="quill-toolbar" id={id} hidden={hidden}>
      {children}
      {options.map(renderOption)}
    </Wrapper>
  );
}

export default Toolbar;
