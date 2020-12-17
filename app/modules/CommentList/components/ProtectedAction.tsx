/**
 * @file contains React component that renders comment removal confirmation box
 */
import { observer } from 'mobx-react';
import React from 'react';

import ProtectedAuth from 'modules/Auth/ProtectedAuth';
import styled from 'styled-components';

const Wrapper = styled.div`
  margin-top: 5px;
  padding: 5px 10px;
  border: 1px solid ${(props) => props.theme.input.border};
  background: ${(props) => (props.theme.isDark ? '#25313a' : '#f9f9f9')};
  border-radius: 4px;
`;

interface IProps {
  /**
   * close action handler
   * @see props in ProtectedAuth component
   */
  onClose: () => void;
  /**
   * success password auth callback
   * @see props in ProtectedAuth component
   */
  onSuccess: () => void;
}

const ProtectedAction: React.FC<IProps> = observer(({ onClose, onSuccess }) => (
  <Wrapper>
    <ProtectedAuth onClose={onClose} onSuccess={onSuccess} />
  </Wrapper>
));

export default ProtectedAction;
