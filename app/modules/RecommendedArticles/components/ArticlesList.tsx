import * as React from 'react';
import styled from 'styled-components';

import Card from '@vuukle/card';
import { translation } from 'services/translation';

/** Component Props */
interface IProps {
  /** Articles List to render */
  articles: Articles.Article[];
  /**
   * Use vertical instead of horizontal
   * @default false
   */
  isVerticalCards?: boolean;
  className?: string;
  linkTarget?: HTMLLinkElement['target'];
}

const ArticlesList: React.FC<IProps> = ({ articles, isVerticalCards = false, linkTarget, className = '' }) => (
  <div className={className}>
    {articles.map((article) => (
      <Card
        key={article.articleId}
        heading={article.excerpt || article.title}
        img={article.articleAvatar}
        link={article.uri}
        linkRel="noopener nofollow"
        linkTarget={linkTarget}
        mode={isVerticalCards ? 'vertical' : 'horizontal'}
      >
        {article.commentCount > 0 && (
          <small style={{ marginRight: '5px' }}>
            {article.commentCount}{' '}
            {article.commentCount > 1 ? translation.commentText.whenX : translation.commentText.when1}
          </small>
        )}
      </Card>
    ))}
  </div>
);

const StyledArticlesList = styled(ArticlesList)`
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  justify-content: space-between;

  ${Card} {
    flex: 0 49%;
    margin-bottom: 10px;
    small {
      color: ${(props) => props.theme.mutedColor};
      font-weight: 500;
    }
  }

  @media (max-width: 450px) {
    ${Card} {
      flex: 0 100%;
    }
  }
`;

export default StyledArticlesList;
