import Button from '@vuukle/button';
import * as React from 'react';
import styled from 'styled-components';

interface IProps {
  className?: string;
  style?: React.CSSProperties;
}

const Bell: React.FC<IProps> = (props) => (
  <Button sm={true} type="subtle" {...props}>
    <svg viewBox="0 0 459.334 459.334">
      <g>
        <path
          d="M175.216,404.514c-0.001,0.12-0.009,0.239-0.009,0.359c0,30.078,24.383,54.461,54.461,54.461
                s54.461-24.383,54.461-54.461c0-0.12-0.008-0.239-0.009-0.359H175.216z"
        />
        <path
          d="M403.549,336.438l-49.015-72.002c0-22.041,0-75.898,0-89.83c0-60.581-43.144-111.079-100.381-122.459V24.485
                C254.152,10.963,243.19,0,229.667,0s-24.485,10.963-24.485,24.485v27.663c-57.237,11.381-100.381,61.879-100.381,122.459
                c0,23.716,0,76.084,0,89.83l-49.015,72.002c-5.163,7.584-5.709,17.401-1.419,25.511c4.29,8.11,12.712,13.182,21.887,13.182
                H383.08c9.175,0,17.597-5.073,21.887-13.182C409.258,353.839,408.711,344.022,403.549,336.438z"
        />
      </g>
    </svg>
  </Button>
);

const StyledBell = styled(Bell)`
  svg {
    height: 20px;
    path {
      fill: ${(props) => props.theme.mutedColor};
    }
  }
`;

export default StyledBell;
