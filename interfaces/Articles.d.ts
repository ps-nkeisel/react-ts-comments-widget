/**
 * @description Common used types/interfaces for 'Article' (recommended articles)
 */
declare namespace Articles {
  interface ServerArticle {
    host: string;
    uri: string;
    articleId: number | string;
    title: string;
    articleAvatar: string;
    emotes: Emotes.KeyValue;
    tag: string;
    apiKey: string;
    commentCount: number;
    likeCount: number;
  }

  interface Article {
    host: string;
    uri: string;
    title: string;
    articleAvatar: string;
    commentCount: number;
    articleId: string | number;
    excerpt?: string;
    mostVotedEmote?: {
      key: Emotes.emoteNum;
      percent: number;
      votes?: number;
      name?: string;
      img?: string;
    };
  }
}
