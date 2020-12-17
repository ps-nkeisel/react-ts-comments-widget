import { loadJS } from '@vuukle/utils';
import { action, computed, decorate, observable, when } from 'mobx';
import urlSearchParams from 'services/urlSearchParams';

export class Transliteration {
  /** Transliteration enabled/disabled */
  public enabled: boolean;
  /** Language code to use transliteration for */
  public languageCode: string;
  /** Currently enabled language code. It can be 'en' or this.languageCode */
  public currentLanguage: string;
  /** Transliteration enabled by default yes/no. If no then english is default */
  public enabledByDefault: boolean;
  /** Instance of google transliteration plugin */
  public transliterationControl: any;
  /** Determines if transliteration plugin has been loaded */
  public loaded: boolean = false;
  /** List of available languages for transliteration */
  public languages: { [key: string]: string } = {
    am: 'Amharic',
    ar: 'Arabic',
    bn: 'Bengali',
    el: 'Greek',
    en: 'English',
    fa: 'Persian',
    gu: 'Gujarati',
    hi: 'Hindi',
    kn: 'Kannada',
    ml: 'Malayalam',
    mr: 'Marathi',
    ne: 'Nepali',
    or: 'Oriya',
    pa: 'Punjabi',
    ru: 'Russian',
    sa: 'Sanskrit',
    si: 'Sinhalese',
    sr: 'Serbian',
    ta: 'Tamil',
    te: 'Telugu',
    ti: 'Tigrinya',
    ur: 'Urdu',
    zh: 'Chinese',
    zn: 'Chinese',
  };
  /** Stores textarea elements where use can write comment. We can have several write comment boxes opened at the same time */
  private readonly transliterationBoxes: Set<any>;

  constructor() {
    this.languageCode = urlSearchParams.get('lang') || 'en';
    this.enabledByDefault = urlSearchParams.get('l_d') === 'true';
    this.enabled = this.languageCode !== 'en';
    this.currentLanguage = this.enabledByDefault ? this.languageCode : 'en';
    this.transliterationBoxes = new Set();
    this.loaded = false;

    if (this.languageCode !== 'en') {
      this.loadTransliteration();
    }
  }

  /**
   * Get currently enabled transliteration language code
   * @return {string}
   */
  get language(): string {
    return this.languages[this.currentLanguage] || this.currentLanguage;
  }

  /** Init or Remove initialization from textarea ID */
  public toggleBox = (id: string): void => {
    if (this.transliterationBoxes.has(id)) {
      this.transliterationBoxes.delete(id);
    } else {
      this.transliterationBoxes.add(id);
    }

    when(
      () => this.loaded,
      () => {
        this.transliterationControl.makeTransliteratable(Array.from(this.transliterationBoxes));
        if (this.currentLanguage === 'en') {
          this.transliterationControl.disableTransliteration();
        } else {
          this.transliterationControl.enableTransliteration();
        }
      }
    );
  };

  public toggleLanguage = () => {
    this.currentLanguage = this.currentLanguage === 'en' ? this.languageCode : 'en';

    when(
      () => this.loaded,
      () => {
        if (this.currentLanguage !== 'en') {
          return this.transliterationControl.enableTransliteration();
        }
        return this.transliterationControl.disableTransliteration();
      }
    );
  };

  private loadTransliteration = () => {
    loadJS('https://www.google.com/jsapi')
      .then(() => {
        loadJS('https://cdn.jsdelivr.net/gh/vuukle/transliterate@1.0/js/transliteration.I.js').then(() => {
          // 📦 Load CSS for transliteration
          const fileRef = document.createElement('link');
          fileRef.setAttribute('rel', 'stylesheet');
          fileRef.setAttribute('type', 'text/css');
          fileRef.setAttribute('href', 'https://cdn.jsdelivr.net/gh/vuukle/transliterate@1.0/css/transliteration.css');
          document.getElementsByTagName('head')[0].appendChild(fileRef);

          // Create an instance on TransliterationControl with the required
          // options.
          this.transliterationControl = new (window as any).google.elements.transliteration.TransliterationControl({
            destinationLanguage: [this.languageCode],
            sourceLanguage: 'en',
            transliterationEnabled: this.enabledByDefault,
          });
          this.loaded = true;
        });
      })
      .catch((err) => {
        if (process.env.NODE_ENV === 'development') {
          // tslint:disable-next-line
          console.log('Transliteration loading err:', err);
        }
      });
  };
}

decorate(Transliteration, {
  currentLanguage: observable,
  languageCode: observable,
  loaded: observable,

  language: computed,

  toggleBox: action,
  toggleLanguage: action,
});

export default new Transliteration();
