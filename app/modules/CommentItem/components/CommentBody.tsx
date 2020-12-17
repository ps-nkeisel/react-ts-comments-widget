import React from 'react';
import styled from 'styled-components';

import TruncateText from '@vuukle/truncate-text';
import { translation } from 'services/translation';

interface IProps {
  edited: boolean;
  commentText: string;
  collapsed: boolean;

  className?: string;
  style?: React.CSSProperties;
}

const Wrapper = styled.div`
  color: ${(props) => props.theme.textColor};
  margin: 0 0 10px;
`;

const EditedBadge = styled.small`
  color: ${(props) => props.theme.mutedColor};
  margin: 0 5px;
`;

const CommentBody: React.FC<IProps> = ({ edited, commentText, collapsed }: IProps) => (
  <>
    {!collapsed && (
      <Wrapper className="v-comment__comment">
        <TruncateText seeMore={translation.common.readMore}>
          <span dangerouslySetInnerHTML={{ __html: commentText }} />
          {edited && <EditedBadge>{translation.common.edited}</EditedBadge>}
        </TruncateText>
      </Wrapper>
    )}
  </>
);

export default CommentBody;
