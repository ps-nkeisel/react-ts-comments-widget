import * as React from 'react';
import styled, { css, keyframes } from 'styled-components';

// keyframes returns a unique name based on a hash of the contents of the keyframes
const ballScale = keyframes`
  0% {
    transform: scale(0)
  }
  100% {
    transform: scale(1);
    opacity: 0.5
  }
`;

const toxicAnimation = keyframes`
  0% {
    border-radius: 50%;
    transform: scale(0.3);
  }
  50% {
    transform: scale(1.2) rotate(90deg);
    border-radius: 0%;
  }
  100% {
    transform: rotate(225deg);
  }
`;

const mediumAnimation = keyframes`
  0% {
    border-radius: 50%;
    transform: scale(0.3);
  }
  50% {
    transform: scale(1.2);
    border-radius: 0%;
  }
`;

const lowAnimation = keyframes`
  0% {
    border-radius: 50%;
    transform: scale(0.3);
  }
  50% {
    transform: scale(1.2);
    border-radius: 0%;
  }
`;

const fadeIn = keyframes`
  0% {
    opacity: 0;
  }
  100% {
    opacity: 1;
  }
`;

const Progress = styled.div<IProps>`
  height: 15px;
  width: 15px;
  background-color: ${(props) => {
    if (props.loading) {
      return '#868e96';
    } else if (props.value >= 75) {
      return '#b719fa';
    } else if (props.value >= 50) {
      return '#7a4ffe';
    } else if (props.value >= 25) {
      return '#5185fc';
    }
    return '#2db6f9';
  }};
  border-radius: ${(props) => (!props.loading && props.value >= 25 ? 0 : '100%')};
  margin: 2px;
  display: inline-block;
  vertical-align: middle;
  margin-right: 10px;
  transform: ${(props) => {
    if (!props.loading) {
      if (props.value >= 75) {
        return 'rotate(135deg)';
      } else if (props.value >= 25) {
        return 'rotate(90deg)';
      }
    }
    return 'rotate(0)';
  }};
  animation: ${(props) => {
    if (props.loading) {
      return css`
        ${ballScale} 1s 0s ease-in-out infinite;
      `;
    } else if (props.value >= 75) {
      return css`
        ${toxicAnimation} .5s ease-in;
      `;
    } else if (props.value >= 50) {
      return css`
        ${mediumAnimation} .5s ease-in;
      `;
    } else if (props.value >= 25) {
      return css`
        ${lowAnimation} .5s ease-in;
      `;
    } else {
      return null;
    }
  }};
`;

const Span = styled('span')`
  vertical-align: middle;
  display: inline;
  animation: ${fadeIn} 0.25s ease-in;
  font-size: 0.75rem;
`;

interface IProps {
  value: number;
  loading: boolean;
  toxicityText?: string;
  visibilityLimit?: number;
}

const ToxicityMeter: React.FC<IProps> = ({
  value,
  loading,
  visibilityLimit = 50,
  toxicityText = '',
}) => (
  <>
    {/** We don't need display progress if limit is >= 100 */}
    {visibilityLimit < 100 && (
      <div style={{ marginRight: '5px' }}>
        <Progress loading={loading} value={value} />
        {!loading && visibilityLimit < value && (
          <Span>
            {value}%<span> {toxicityText}</span>
          </Span>
        )}
      </div>
    )}
  </>
)

export default ToxicityMeter;
