import { action, computed, decorate, observable } from 'mobx';

import { perspectiveAPIs } from 'services/apis';
import searchParams from 'services/urlSearchParams';

import { makeDevLog } from '@vuukle/utils';

import { normalizeString } from 'utils/';

export class SpamValidation {
  /**
   * PerspectiveAPI Toxicity Model
   * {@link https://github.com/conversationai/perspectiveapi/blob/master/api_reference.md}
   * null - toxicity is in progress
   * number - when we have toxicity number or error loading and we set 0
   */
  public value: number = 0;
  /**
   * Configured limit of the model. User cannot post comments if limit exceeded
   */
  public readonly limit: number = 90;
  /**
   * Unlike toxicity restrict, users can post spammy comments but before this action should be confirmed.
   * Users are asked with alert if they are ready to post spam comment.
   */
  public confirmed: boolean = false;

  constructor() {
    // Get toxicity and spam limit. Not valid values convert to default value and 0 to 100
    const limitFromUrl = parseInt(searchParams.get('spamLimit') || '90', 10) || 100;

    this.limit = limitFromUrl >= 0 ? limitFromUrl : 90;
  }

  /** Determines if spam is enabled or not */
  get enabled() {
    return this.limit < 100 && this.limit > 0;
  }

  public getValue = async (commentText: string): Promise<number> => {
    if (!this.enabled) {
      this.value = 0;
      return this.value;
    }

    this.confirmed = false; // if we are getting new value then confirmed should be reseted

    try {
      const normalized: string = normalizeString(commentText);
      const response: any = await perspectiveAPIs.spamModel.send(normalized);
      this.value = response.value;

      return this.value;
    } catch (err) {
      makeDevLog('error', `PerspectiveAPIs.toxicModel error: `, err);
      this.value = 0;

      return this.value;
    }
  };
}

decorate(SpamValidation, {
  value: observable,

  enabled: computed,
  getValue: action,
});

export default SpamValidation;
