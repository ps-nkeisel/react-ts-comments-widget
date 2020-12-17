import Button from '@vuukle/button';
import * as React from 'react';
import styled from 'styled-components';

interface IProps {
  className?: string;
  /** The function to execute on Report Comment */
  reportFunction: () => void;
}

const ReportComment: React.FC<IProps> = ({ className, reportFunction }) => (
  <Button onClick={reportFunction} className={className} type="subtle" sm={true}>
    <svg viewBox="0 0 20 20">
      <path d="M14 6l-1-2H5v17h2v-7h5l1 2h7V6h-6zm4 8h-4l-1-2H7V6h5l1 2h5v6z" />
    </svg>
  </Button>
);

const StyledReportComment = styled(ReportComment)`
  svg {
    height: 14px;
    vertical-align: text-top;
    fill: ${(props) => props.theme.mutedColor};
  }

  &:active,
  &:focus {
    box-shadow: none !important;
  }
`;

export default StyledReportComment;
