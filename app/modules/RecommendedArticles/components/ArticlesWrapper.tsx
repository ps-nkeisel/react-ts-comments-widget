import Button from '@vuukle/button';
import React from 'react';
import styled from 'styled-components';

import { translation } from 'services/translation';

/** Component Wrapper Styles */
const Wrapper = styled.div`
  margin-top: 30px;
  padding: 0 1px;
  h4 {
    font-weight: bold;
    text-transform: uppercase;
  }

  ${Button} {
    display: block;
    width: 100%;
  }
`;

interface IProps {
  children: any;
  /**
   * Show or hide button to load more articles
   * @default false
   */
  showLoadMore: boolean;
  /** On click handler for more button click */
  onLoadMore: () => void;
  /** Current state of API request */
  loading: boolean;

  className?: string;
}

const ArticlesWrapper: React.FC<IProps> = ({ children, showLoadMore, onLoadMore, loading, ...props }) => (
  <Wrapper {...props}>
    <h4>{translation.recommendedStories /* 'Talk of the town' */}</h4>
    {children}
    {showLoadMore && <Button loading={loading} onClick={onLoadMore}>{translation.buttons.showMoreArticles}</Button>}
  </Wrapper>
);

export default ArticlesWrapper;
