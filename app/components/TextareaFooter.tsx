import darken from 'polished/lib/color/darken';
import styled from 'styled-components';

interface IProps {
  focused: boolean;
  children?: any;
  language?: string;
  toggleLanguage?: () => void;
  charsLimit?: number;
}

const TextareaFooterWrapper = styled('div')<IProps>`
  min-height: 30px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 7px 10px;
  margin: 0;
  font-size: 0.8rem;
  color: ${(props) => props.theme.mutedColor};
  background-color: ${(props) => darken(0.02, props.theme.input.background)};
  border: 1px solid ${(props) => (props.focused ? props.theme.input.active.border : props.theme.input.border)};
  border-top: 0;
  border-bottom-right-radius: 3px;
  border-bottom-left-radius: 3px;
`;

export default TextareaFooterWrapper;
