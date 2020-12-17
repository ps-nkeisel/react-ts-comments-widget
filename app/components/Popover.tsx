import * as React from 'react';
import styled from 'styled-components';

interface IProps {
  /**
   * Popover appears on either hover or click
   * @param {string} hover - Appear on hover
   * @param {string} click - Appear on click (on children)
   * @param {string} nothing - Don't appear (Useful when we need to control it with showPopover)
   *
   */
  appearOn: 'hover' | 'click' | 'nothing';
  className?: string;
  /**
   * Popover children are the components we are placing a hover on...
   * To show a component around it
   */
  children: any;
  /**
   * Placement of the popover relative to the children.
   */
  placement: 'left' | 'right' | 'bottom' | 'top' | 'bottom-left';
  /**
   * Component to display inside popover on hover of the children
   */
  component: Array<React.ReactElement<any>> | React.ReactElement<any>;
  /**
   * Can be used to control popover state.
   */
  showPopover?: boolean;
  /**
   * Custom onMouseEnter handler in case we need to do something programmatically when the children are hovered
   */
  onMouseEnter?: (e: React.MouseEvent<any>) => void;
  /**
   * Custom onClick handler in case other actions need to be handled with mouse clicks
   */
  onClick?: (e: React.MouseEvent<any>) => void;
}

/**
 * @name Popover
 * @description Displays a React component when hovering over the children of itself
 */
const Popover: React.FC<IProps> = ({
  className,
  children,
  placement,
  component,
  onClick,
  onMouseEnter,
}) => (
  <div className={className}>
    <div
      className={placement !== 'top' ? `v-popover v-popover-${placement}` : 'v-popover'}
      onMouseEnter={onMouseEnter}
      onClick={onClick}
    >
      {children}
      <div className="v-popover__container">{component}</div>
    </div>
  </div>
);

const StyledPopover = styled(Popover)`
  display: inline-block;
  position: relative;

  .v-popover {
    .v-popover__container {
      left: 50%;
      opacity: 0;
      padding: 0.4rem;
      position: absolute;
      top: 0;
      transform: translate(-50%, -50%) scale(0);
      transition: transform 0.2s;
      width: 320px;
      z-index: 300;
      ${(props) =>
        typeof props.showPopover === 'boolean' &&
        props.showPopover &&
        `display: block; opacity: 1; transform: translate(-50%, -100%) scale(1);`}
    }

    *:focus + .v-popover__container,
    ${(props) => props.appearOn === 'hover' && '&:hover .v-popover__container'}
      ${(props) => props.appearOn === 'click' && '&:active .v-popover__container'} {
      display: block;
      opacity: 1;
      transform: translate(-50%, -100%) scale(1);
    }

    &.v-popover-right {
      .v-popover__container {
        left: 100%;
        top: 50%;
        ${(props) =>
          typeof props.showPopover === 'boolean' && props.showPopover && `transform: translate(0, -50%) scale(1);`}
      }

      *:focus + .v-popover__container,
      ${(props) => props.appearOn === 'hover' && '&:hover .v-popover__container'}
        ${(props) => props.appearOn === 'click' && '&:active .v-popover__container'} {
        transform: translate(0, -50%) scale(1);
      }
    }

    &.v-popover-bottom {
      .v-popover__container {
        left: 50%;
        top: 100%;
        ${(props) =>
          typeof props.showPopover === 'boolean' && props.showPopover && `transform: translate(-50%, 0) scale(1);`}
      }

      *:focus + .v-popover__container,
      ${(props) => props.appearOn === 'hover' && '&:hover .v-popover__container'}
        ${(props) => props.appearOn === 'click' && '&:active .v-popover__container'} {
        transform: translate(-50%, 0) scale(1);
      }
    }

    &.v-popover-bottom-left {
      .v-popover__container {
        left: 50%;
        top: 100%;
        ${(props) =>
          typeof props.showPopover === 'boolean' && props.showPopover && `transform: translate(-93%, 0) scale(1);`}
      }

      *:focus + .v-popover__container,
      ${(props) => props.appearOn === 'hover' && '&:hover .v-popover__container'}
        ${(props) => props.appearOn === 'click' && '&:active .v-popover__container'} {
        transform: translate(-93%, 0) scale(1);
      }
    }

    &.v-popover-left {
      .v-popover__container {
        left: 0;
        top: 50%;
        ${(props) =>
          typeof props.showPopover === 'boolean' && props.showPopover && `transform: translate(-100%, -50%) scale(1);`}
      }

      *:focus + .v-popover__container,
      ${(props) => props.appearOn === 'hover' && '&:hover .v-popover__container'}
        ${(props) => props.appearOn === 'click' && '&:active .v-popover__container'} {
        transform: translate(-100%, -50%) scale(1);
      }
    }
  }
`;

export default StyledPopover;
