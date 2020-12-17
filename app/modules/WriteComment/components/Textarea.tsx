import * as React from 'react';
import Textarea from 'react-textarea-autosize';
import styled from 'styled-components';

interface IThemeProps {
  theme: {
    mutedColor: string;
    input: {
      background: string;
      color: string;
      border: string;
      active: {
        border: string;
      };
    };
  };
}

const StyledTextArea = styled(Textarea)<any & IThemeProps>`
  display: block;
  width: 100%;
  resize: none;
  padding: 15px 10px 10px;
  border-radius: 3px 3px 0 0;
  margin: 0;
  border-image: initial;
  background: ${(props) => props.theme.input.background};
  color: ${(props) => props.theme.input.color};
  border: 1px solid ${(props) => props.theme.input.border};
  border-bottom: 1px dashed ${(props) => props.theme.input.border};
  &::placeholder {
    color: ${(props) => props.theme.mutedColor};
  }
  &:focus {
    outline: none;
    border-color: ${(props) => props.theme.input.active.border};
  }
`;

const TextareaWrapper = (props: any) => <StyledTextArea name="comment" {...props} />;

export default TextareaWrapper;
