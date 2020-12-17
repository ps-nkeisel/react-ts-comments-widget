/**
 * Serialize object
 * @param {object} obj - object which needs to be serialized
 * @returns {string} - Example: ross=123&name=ross
 */
const serialize = (obj: object): string => {
  if (!(obj instanceof Object)) {
    return '';
  }
  return Object.keys(obj)
    .filter((key) => obj[key] !== undefined && obj[key] !== null)
    .map((key) => key + '=' + obj[key])
    .join('&');
};

export class Request {
  private xhr: XMLHttpRequest = new XMLHttpRequest();

  constructor(
    public method: 'GET' | 'POST' | 'DELETE',
    public url: string,
    public requireAuth: boolean = false,
    public contentType?: string,
    public baseParams: object = {}
  ) {}

  /**
   * Public send
   * @param {object} params - additional params we want to add to response
   * @return {Promise}
   */
  public send = (params: {}): Promise<object | Error> => {
    return new Promise((resolve, reject) => {
      const mergedParams = { ...this.baseParams, ...params };
      const url = this.method === 'GET' ? `${this.url}?${serialize(mergedParams)}` : this.url;

      this.xhr.open(this.method, url, true /* Async */);

      if (this.contentType) {
        this.xhr.setRequestHeader('Content-type', 'application/json');
      }

      this.xhr.onload = () => resolve(JSON.parse(this.xhr.response));

      this.xhr.onerror = () => reject(new Error(this.xhr.statusText));
      this.xhr.onabort = () => reject(new Error('cancelled'));

      if (this.method === 'GET') {
        this.xhr.send();
      } else {
        this.xhr.send(JSON.stringify(mergedParams));
      }
    });
  };

  /**
   * Cancel pending request
   * @return {void}
   */
  public cancel = (): void => this.xhr.abort();
}

export default Request;
