/**
 * @file Store to manage recommended articles section
 */
import { action, decorate, observable } from 'mobx';
import { articlesAPIs } from 'services/apis';
import urlSearchParams from 'services/urlSearchParams';
import { createTitleExcerpt } from 'utils';
import widgetStore from 'stores/widgetStore';
import { makeDevLog } from '@vuukle/utils';

/**
 * Recommended Articles Store
 * Used to store articles related config and articles items itself
 */
export class ArticlesStore {
  /**
   * Recommended articles are disabled (not needed to render).
   * @default false
   */
  public disabled: boolean = false;
  /**
   * Global Articles Recommendations.
   * This configuration item determines if publisher wants to load recommendations from all domains available by api key
   * @default false
   */
  public global: boolean = false;
  /**
   * Publisher can configure custom articles link structure (protocol,additional paths etc.)
   * For example it can be: 'http://[url]', 'https://www.[url]' etc.
   * And we just replace '[url]' with actual article url we receive from the server
   * @default 'http://[url]' @see ArticlesStore.constructor
   */
  public link: string = 'http://[url]';
  /**
   * Publisher can enable vertical cards styles
   * @default false We show horizontal styled cards by default
   */
  public isVerticalCards: boolean = false;
  /**
   * Custom styles object that we receive by porthole based on VUUKLE_CONFIG.theme.cardStyles
   */
  public customCardStyles = {};
  /** 🔧State */
  @observable private items: Articles.Article[] = [];
  // If we have more than 6 articles we should set this to false,
  // so expand button will be shown and will toggle this to true. This is needed only once.
  @observable private articlesToShow: number = 6;
  // Indicates if the API request is in progress or not
  @observable public loading: boolean = false;
  // Are there more articles to load or not
  @observable public moreAvailable: boolean = true;

  constructor() {
    this.disabled = urlSearchParams.get('hideArticles') === 'true';
    /** If articles disabled we don't need to do anything */
    if (this.disabled) {
      return;
    }

    this.global = urlSearchParams.get('gr') === 'true';
    this.isVerticalCards = urlSearchParams.get('totWideImg') === 'true';
    this.link = urlSearchParams.get('link') || 'http://[url]';
  }

  /**
   * Get articles list.
   * @return {Array<Object>} First 6 articles or full list based on this.articlesExpanded
   */
  get articles(): Articles.Article[] {
    return this.items.slice(0, this.articlesToShow);
  }

  /**
   * Set article items.
   * @param {Array<Object>} articles list we received from the server response from loadVuukle
   * @return {void}
   */
  set articles(articles: Articles.Article[]) {
    if (this.disabled) {
      return;
    }
    this.items = articles;
  }

  /** Show more articles */
  public showMoreArticles = () => {
    if (!this.disabled) {
      this.fetchArticlesFromServer();
    }
  };

  /** Makes a network request to get articles for that publisher */
  public fetchArticlesFromServer = async () => {
    try {
      this.loading = true;
      const response = await articlesAPIs.getPopularArticlesByHost(widgetStore.article.host, this.items.length);
      // Maximum of 10 articles can be fetched from the server at once,
      // if the number of articles in response is lower than 10,
      // We should indicate that there are no more articles to be fetched
      if (response.data.length < 10 || !response.data.length) {
        this.moreAvailable = false;
      }

      if (response.data) {
        this.setArticlesFromServer(response.data, response.data.length + this.items.length);
      }
    } catch (err) {
      makeDevLog('error', 'Articles API error!', err);
    } finally {
      this.loading = false;
    }
  };

  /**
   * Parse and set articles received from the server
   * @param {Array<object>} articles - articles received from server
   * @return {void}
   */
  public setArticlesFromServer = (articles: Articles.ServerArticle[], articlesToShowBeforeExpand: number): void => {
    // ⬇ We don't need to do anything if articles disabled
    if (this.disabled) {
      return;
    }

    this.articlesToShow = articlesToShowBeforeExpand;

    this.articles = [
      ...this.articles,
      ...articles.map(
        (article): Articles.Article => {
          /** Only use the URI if the host link isn't a relative link. */
          const doesURIContainTheHost: boolean = article.uri ? article.uri.indexOf(article.host) > -1 : false;
          const link: string = doesURIContainTheHost ? article.uri : `${article.host}${article.uri || ''}`;
          return {
            articleAvatar: article.articleAvatar,
            articleId: article.articleId,
            commentCount: article.commentCount,
            excerpt: createTitleExcerpt(article.title, 120),
            host: article.host,
            title: article.title,
            uri: `${process.env.API_URL}/stats/External?source=talk_of_town&url=${this.link.replace('[url]', link)}`,
          };
        }
      ),
    ];
  };
}

decorate(ArticlesStore, {
  customCardStyles: observable,

  fetchArticlesFromServer: action,
  setArticlesFromServer: action,
  showMoreArticles: action,
});

export default new ArticlesStore();
