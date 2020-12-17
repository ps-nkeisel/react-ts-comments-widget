import Button from '@vuukle/button';
import * as React from 'react';
import styled from 'styled-components';

interface IProps {
  className?: string;
  /** Custom click handler */
  onClick?: (e?: React.MouseEvent<any>) => void;
}

const MarkAsRead: React.FC<IProps> = ({ className, onClick }) => (
  <Button sm={true} type="subtle" className={className} onClick={onClick}>
    <svg viewBox="0 0 14 8">
      <g stroke="none" fill="none">
        <g transform="translate(-264.000000, -70.000000)">
          <g transform="translate(262.000000, 65.000000)">
            <g>
              <path d="M3.75,9.75 L14.25,9.75 L14.25,8.25 L3.75,8.25 L3.75,9.75 Z M2.25,12.75 L12.75,12.75 L12.75,11.25 L2.25,11.25 L2.25,12.75 Z M5.25,5.25 L5.25,6.75 L15.75,6.75 L15.75,5.25 L5.25,5.25 Z" />
              <polygon points="0 0 18 0 18 18 0 18" />
            </g>
          </g>
        </g>
      </g>
    </svg>
  </Button>
);

const StyledMarkAsRead = styled(MarkAsRead)`
  padding: 4px;
  width: 35px;
  svg {
    height: 12px;
    path {
      fill: ${(props) => props.theme.mutedColor};
    }
  }
`;

export default StyledMarkAsRead;
