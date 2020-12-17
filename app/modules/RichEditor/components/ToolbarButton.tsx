import React from 'react';
import styled from 'styled-components';

interface IButtonProps {
  active?: boolean;
  disabled?: boolean;
  className?: string;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  /** Needed for rendering element as <label> */
  htmlFor?: string;
}

const commonStyles = `
  -webkit-appearance: none !important;
  outline: none;
  border: none;
  background: transparent;
  transition: color 0.2s;
  cursor: pointer;
  margin: 0;
  padding: 0 5px;
`;

export const ToolbarButton = styled.button<IButtonProps>`
  ${commonStyles}

  &:hover {
    svg {
      fill: ${(props) => props.theme.textColor};
      transition: all 0.3s;
    }
  }

  svg {
    max-width: 20px;
    width: 100%;
    fill: ${(props) => props.theme.mutedColor};
    ${(props) => props.disabled && `fill: ${props.theme.mutedColor} !important`};
  }

  /* Button is Active */
  &.ql-active {
    color: ${(props) => props.theme.textColor};
    font-weight: bold;
    svg {
      fill: ${(props) => props.theme.textColor};
    }
  }

  ${(props) => props.disabled && `cursor: not-allowed;`}
`;

export const ToolbarLabel = styled.label<IButtonProps>`
  ${commonStyles}

  &:hover {
    svg {
      fill: ${(props) => props.theme.textColor};
      transition: all 0.3s;
    }
  }

  svg {
    max-width: 20px;
    width: 100%;
    fill: ${(props) => props.theme.mutedColor};
    ${(props) => props.disabled && `fill: ${props.theme.mutedColor} !important`};
  }

  /* Button is Active */
  &.ql-active {
    color: ${(props) => props.theme.textColor};
    font-weight: bold;
    svg {
      fill: ${(props) => props.theme.textColor};
    }
  }

  ${(props) => props.disabled && `cursor: not-allowed;`}
`;
