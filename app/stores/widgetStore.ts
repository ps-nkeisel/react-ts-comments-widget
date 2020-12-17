import { decorate, observable } from 'mobx';
import urlSearchParams from 'services/urlSearchParams';

export class WidgetStore {
  /** Determines if real-time typing and comments update feature is enabled */
  public realtime: boolean;
  /** Comments widget transliteration language */
  public language: string;
  /** Global language of the page/all widgets */
  public globalLanguage: string;
  /** Publisher API key */
  public apiKey: string;
  public commentingDisabled: boolean = false;
  /** Indicate if the whole comments widget is hidden */
  public widgetHidden: boolean = false;
  /** Widget is on AMP article */
  public amp: boolean = false;
  /** Open ToT articles in same tab */
  public openInSameTab: boolean = false;
  /** Article Details */
  public article: {
    refHost: string;
    /** Article host */
    host: string;
    /** Article ID */
    id: string;
    /** Article title/heading */
    title: string;
    /** Article URL */
    url: string;
    /** Article image */
    img: string;
    /** Article tags */
    tags: string;
    /** Article author */
    author: string;
  };
  public theme: {
    /** Determines if widget is loaded on dark theme */
    darkMode: boolean;
    /** Primary widget color */
    color: string | null;
    /** Custom font-family */
    font: string | null;
  };
  /** Configuration for a custom privacy policy agreement checkbox from a publisher */
  public privacy: {
    /** The checkbox text before the link */
    checkboxText: string;
    /** Link to privacy policy page */
    privacyPolicyLink: string;
    /** Text to display for privacy policy link */
    privacyPolicyLinkText?: string;
  }

  /** Modal Widget is loaded */
  public modalLoaded: boolean = false;
  /** Disabled dropdown options */
  public disabledOptions: string[] = [];
  /** Hides login methods and generates random name and email when guest commenting is enabled */
  public anonymousCommenting: boolean = false;
  /** Indicates that a fallback token for anonymous auth exists */
  public hasAnonFallback: boolean = false;

  /** Config we will use for transliteration */
  // transliterationConfig: Transliteration = TransliterationStore;
  constructor() {
    this.language = urlSearchParams.get('lang') || 'en';
    this.globalLanguage = urlSearchParams.get('globalLang') || 'en';
    this.apiKey = urlSearchParams.get('apiKey') || '';
    this.realtime = urlSearchParams.get('realtime') === 'true';
    this.amp = urlSearchParams.get('amp') === 'true';
    this.widgetHidden = urlSearchParams.get('hideCommentsWidget') === 'true';
    this.openInSameTab = urlSearchParams.get('openInSameTab') === 'true';

    this.article = {
      author: urlSearchParams.get('author') || '',
      host: urlSearchParams.get('host') || '',
      id: urlSearchParams.get('articleId') || '',
      img: urlSearchParams.get('img') || '',
      refHost: urlSearchParams.get('refHost') || '',
      tags: urlSearchParams.get('tags') || '',
      title: urlSearchParams.get('title') || '',
      url: urlSearchParams.get('url') || '',
    };

    this.theme = {
      color: urlSearchParams.get('color'),
      darkMode: urlSearchParams.get('darkMode') === 'true',
      font: urlSearchParams.get('font'),
    };

    this.privacy = {
      checkboxText: urlSearchParams.get('privacyCheckText') || '',
      privacyPolicyLink: urlSearchParams.get('privacyCheckLink') || '',
      privacyPolicyLinkText: urlSearchParams.get('privacyCheckLinkText') || '',
    };

    const disableButtons = urlSearchParams.get('disableButtons');
    this.disabledOptions = disableButtons !== null ? disableButtons.split(',') : [];
    this.anonymousCommenting = urlSearchParams.get('anonymous') === 'true';
    this.hasAnonFallback = urlSearchParams.get('hasAnonFallback') === 'true';
  }
}

decorate(WidgetStore, {
  anonymousCommenting: observable,
  commentingDisabled: observable,
  modalLoaded: observable,
  widgetHidden: observable,
  disabledOptions: observable,
  hasAnonFallback: observable,
});

export default new WidgetStore();
