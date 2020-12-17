class PerspectiveAPI {
  // Flow Types
  private readonly model: 'TOXICITY' | 'SPAM';
  private xhr: XMLHttpRequest = new XMLHttpRequest();

  /**
   * Create PerspectiveAPI item with model
   * @param  {'TOXICITY' | 'SPAM'} model - PerspectiveAPI model to get scores.
   * See: https://github.com/conversationai/perspectiveapi/blob/master/api_reference.md
   */
  constructor(model: 'TOXICITY' | 'SPAM' = 'TOXICITY') {
    this.model = model;
  }

  /**
   * Send model based request to Perspective to get scores and little format response
   * @param  {string} comment - Comment text to analyze
   * @return {Promise}       - returns Promise with formatted response or error text
   */
  public send = (comment: string): Promise<object | string> => {
    this.cancel(); // Cancel pending request and start new one

    const req = this.xhr;
    const reqParams = {
      comment: { text: comment },
      languages: ['en'],
      requestedAttributes: { [this.model]: {} },
    };

    return new Promise((resolve, reject) => {
      if (!comment) {
        reject('empty comment');
      }

      req.open(
        'POST',
        `https://commentanalyzer.googleapis.com/v1alpha1/comments:analyze?key=${process.env.PERSPECTIVE_API_KEY}`,
        true /* async: */
      );
      req.setRequestHeader('Content-type', 'application/json');

      req.onload = () => {
        try {
          const response = JSON.parse(req.response);
          if (response.error) {
            reject(response.error.message);
          }
          resolve({ value: Math.round(response.attributeScores[this.model].summaryScore.value * 100) });
        } catch (err) {
          reject(err);
        }
      };
      req.onerror = () => reject(req.statusText);
      req.onabort = () => reject('request cancelled'); // resolve promise on cancel method 👎

      req.send(JSON.stringify(reqParams));
    });
  };

  /**
   * Cancel pending request - we use this because we have realtime 'TOXICITY'
   * model checking and to don't store previous requests
   * just cancel it and start new
   * @return {void}
   */
  public cancel = (): void => this.xhr.abort();
}

export default PerspectiveAPI;
