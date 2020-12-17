import { action, computed, decorate, observable } from 'mobx';

import { perspectiveAPIs } from 'services/apis';
import searchParams from 'services/urlSearchParams';

import { makeDevLog } from '@vuukle/utils';

import { normalizeString } from 'utils/';

export class ToxicityValidation {
  /**
   * PerspectiveAPI Toxicity Model
   * {@link https://github.com/conversationai/perspectiveapi/blob/master/api_reference.md}
   * null - toxicity is in progress
   * number - when we have toxicity number or error loading and we set 0
   */
  public value: number = 0;
  public loading: boolean = false;
  private checkingTimout: any;
  /**
   * Configured limit of the model. User cannot post comments if limit exceeded
   */
  public readonly limit: number = 80;

  constructor() {
    // Get toxicity and spam limit. Not valid values convert to default value and 0 to 100
    const limitFromUrl = parseInt(searchParams.get('toxicityLimit') || '80', 10) || 100;

    this.limit = limitFromUrl >= 0 ? limitFromUrl : 80;
  }

  /** Determines if toxicity is enabled or not */
  public get enabled(): boolean {
    return this.limit > 0 && this.limit < 100;
  }

  // TODO: improve function
  public getValue = async (commentText: string, timeout: number = 0): Promise<boolean | number> => {
    this.loading = true;
    return new Promise((resolve) => {
      clearTimeout(this.checkingTimout);

      if (!commentText) {
        this.loading = false;
        this.value = 0;
        return resolve(this.value);
      }

      if (timeout <= 0) {
        resolve(this.getToxicity(commentText));
      } else {
        this.checkingTimout = setTimeout(async () => resolve(this.getToxicity(commentText)), timeout);
      }
    });
  };

  // TODO: change naming of that chain
  @action
  private getToxicity = async (commentText: string): Promise<number> => {
    this.loading = true;
    try {
      const normalized: string = normalizeString(commentText);
      const response: any = await perspectiveAPIs.toxicModel.send(normalized);
      this.value = response.value || 0;

      return this.value;
    } catch (err) {
      makeDevLog('error', `PerspectiveAPIs.toxicModel error: `, err);
      this.value = 0;

      return this.value;
    } finally {
      this.loading = false;
    }
  };
}

decorate(ToxicityValidation, {
  loading: observable,
  value: observable,

  enabled: computed,
  getValue: action,
});

export default ToxicityValidation;
