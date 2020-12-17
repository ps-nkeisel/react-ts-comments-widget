import { makeRequest } from '@vuukle/utils';
import { action, computed, decorate, observable } from 'mobx';

import { IAlertValue } from 'stores/models/Alert';
import userStore from 'stores/userStore';

import { translation } from 'services/translation';

enum Errors {
  error_saving_image = 'error_saving_image',
  limit_exceeded = 'limit_exceeded',
  wrong_format = 'wrong_format',
  unknown = 'unknown',
  non_allowed_content = 'non_allowed_content',
}

/** Possible image uploading errors */
const getAlerts = (): { [key: string]: IAlertValue } => {
  return {
    [Errors.error_saving_image]: {
      message: translation.messages.errorSavingImage,
      type: 'error',
    },
    [Errors.limit_exceeded]: {
      message: translation.messages.imageTooBig,
      type: 'error',
    },
    [Errors.unknown]: { message: translation.messages.unknownError, type: 'error' },
    [Errors.wrong_format]: {
      message: translation.messages.wrongImageFormat,
      type: 'error',
    },
    [Errors.non_allowed_content]: {
      message: translation.messages.nonAllowedImage,
      type: 'error',
    },
  };
};

export let alertMessages: { [key: string]: IAlertValue } = getAlerts();

export function updateImageUploadErrorTranslation() {
  alertMessages = getAlerts();
}

/**
 * Responsible for image adding on comment post
 */
class ImageUpload {
  /** images urls */
  public items: string[] = [];
  /** Uploading is in progress */
  public inProgress: boolean = false;
  private allowedFormats: string[] = ['png', 'jpg', 'jpeg', 'bmp', 'gif'];
  /** API method to upload images to the Vuukle Server */
  private uploadAPI = (data: FormData) =>
    makeRequest('POST', `${process.env.API_URL}/api/v1/Comments/uploadCommentImage`, data, undefined, userStore.token);

  /**
   * @param {number} [limit=1] Images number limit that can be uploaded in the same time
   * @param {function} setAlert - function that allows to set Alert value
   */
  constructor(public limit: number = 1, public setAlert: (alert: IAlertValue) => void) {}

  /**
   * Remove image by link
   * @param {string} url - image url to delete
   * @return {void}
   */
  public remove = (url: string): void => {
    this.items = this.items.filter((imageUrl) => imageUrl !== url);
  };

  /**
   * Add image to the list of uploads
   * @param {string} url - image url to add
   */
  public add = (url: string): void => {
    if (this.items.indexOf(url) !== -1) {
      return;
    }

    this.items.push(url);
  };

  /**
   * Detects if upload items limit is exceeded
   * @return {boolean} true limit is exceeded and false it no
   */
  get uploadLimitExceeded(): boolean {
    return this.items.length >= this.limit;
  }

  /**
   * @public
   * Upload Image using Vuukle API
   * @param {File} imageFile image to upload
   * @returns {Promise<void>}
   */
  public upload = async (imageFile: File): Promise<void> => {
    /** Validate file extension */
    const fileExtension =
      imageFile.name
        .toLocaleLowerCase()
        .split('.')
        .pop() || '';

    if (this.allowedFormats.indexOf(fileExtension) === -1) {
      return this.setAlert(alertMessages[Errors.wrong_format]);
    }

    /** Check for file limit */
    if (imageFile.size > 5e6) {
      return this.setAlert(alertMessages[Errors.limit_exceeded]);
    }

    /** Send File to the server */
    const data = new FormData();
    data.append('file', imageFile);
    this.inProgress = true;

    try {
      const uploadResponse = await this.uploadAPI(data);
      if (uploadResponse.success && uploadResponse.data.imgLink) {
        this.add(uploadResponse.data.imgLink);
      } else {
        throw new Error(uploadResponse.errors[0]);
      }
    } catch (err) {
      this.setAlert(alertMessages[err.message || 'unknown'] || alertMessages[Errors.unknown]);
    } finally {
      this.inProgress = false;
    }
  };

  /** Get HTML code for the uploaded images */
  get html(): string {
    return this.items.map((imageUrl: string) => `<p><img src="${imageUrl}"></p>`).join('');
  }
}

decorate(ImageUpload, {
  add: action,
  inProgress: observable,
  items: observable,
  remove: action,
  uploadLimitExceeded: computed,
});

export default ImageUpload;
