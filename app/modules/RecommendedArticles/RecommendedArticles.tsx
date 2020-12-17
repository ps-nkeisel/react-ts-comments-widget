import { observer } from 'mobx-react';
import * as React from 'react';

import articlesStore from './store';
import widgetStore from 'stores/widgetStore';

import ArticlesList from './components/ArticlesList';
import ArticlesWrapper from './components/ArticlesWrapper';

interface IProps {
  className?: string;
}

const Articles: React.FC<IProps> = observer(({ className }) => (
  <>
    {!articlesStore.disabled && articlesStore.articles.length > 0 && (
      <ArticlesWrapper
        className={className}
        showLoadMore={articlesStore.moreAvailable}
        onLoadMore={articlesStore.showMoreArticles}
        loading={articlesStore.loading}
      >
        <ArticlesList
          articles={articlesStore.articles}
          isVerticalCards={articlesStore.isVerticalCards}
          linkTarget={!widgetStore.openInSameTab ? '_blank' : '_top'}
        />
      </ArticlesWrapper>
    )}
  </>
));

export default Articles;
