import lighten from 'polished/lib/color/lighten';
import * as React from 'react';
import styled from 'styled-components';

interface IProps {
  className?: string;
  /** Fills the outline of the icon if user has already voted on the comment */
  isVoted: boolean;
  /** Shows a like or dislike icon depending on type */
  type: 'like' | 'dislike';
}

const VoteIcon: React.FC<IProps> = ({ className }) => (
  <svg viewBox="0 0 90 90" className={className}>
    <g>
      <path
        d="M63.241,31.814c-0.659-1.777,17.699-18.172,6.99-31.457c-2.507-3.109-11.006,14.875-23.077,23.018
      C40.495,27.867,25,37.429,25,42.711v34.202C25,83.272,49.568,90,68.246,90C75.083,90,85,47.124,85,40.312
      C85,33.476,63.9,33.592,63.241,31.814z M20,32.29c-3.288,0-15,2-15,15.608v24.24c0,13.609,11.712,15.109,15,15.109
      c3.287,0-5-2.863-5-11.297V44.086C15,35.244,23.287,32.29,20,32.29z"
      />
    </g>
  </svg>
);

const StyledVoteIcon = styled(VoteIcon)`
  height: 16px;
  fill: none;
  stroke: ${(props) => props.theme.mutedColor};
  stroke-width: 3px;
  ${(props) => props.type === 'dislike' && 'transform: rotate(180deg);'}
  path {
    fill: ${(props) => (props.isVoted ? props.theme.mutedColor : 'none')};
  }

  :hover path {
    fill: ${(props) => lighten(0.15, props.theme.mutedColor)};
  }

  :focus path,
  :active path {
    fill: ${(props) => lighten(0.08, props.theme.mutedColor)};
  }
`;

export default StyledVoteIcon;
