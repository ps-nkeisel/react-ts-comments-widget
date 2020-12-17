export interface IGIFItem {
  type: string;
  id: string;
  slug: string;
  url: string;
  title: string;
  images: {
    fixed_height_still: { url: string; width: number; height: number };
    preview: { url: string; width: number; height: number };
    fixed_width_small: { url: string; width: number; height: number };
    fixed_width_still: { url: string; width: number; height: number };
    original: { url: string; width: number; height: number };
    fixed_height_small: { url: string; width: number; height: number };
    downsized_medium: { url: string; width: number; height: number };
    // Check response if needed to add more
  };
}

export interface IGiphyResponse {
  data: IGIFItem[];
  pagination: {
    total_count: number;
    count: number;
    offset: number;
  };
  meta: {
    status: number;
    msg: string;
    response_id: string;
  };
}

/**
 * Get Trending GIFs
 * @return {Promise<any>}
 */
export const getTrendingGIFs = (limit: number = 10): Promise<IGiphyResponse> =>
  new Promise((resolve, reject) => {
    const req = new XMLHttpRequest();
    req.open('GET', `https://api.giphy.com/v1/gifs/trending?limit=${limit}&rating=g&api_key=${process.env.GIPHY_TOKEN}`);
    req.send();
    req.onload = () => {
      if (req.status >= 200 && req.status < 300) {
        resolve(JSON.parse(req.response));
      } else {
        reject(new Error(req.statusText));
      }
    };
    req.onerror = () => reject(new Error(req.statusText));
    req.onabort = () => reject(new Error('cancelled'));
  });

/**
 * Get trending GIFs
 * @param {string} searchQuery
 * @return {Promise<any>}
 */
export const getSearchGIFs = (searchQuery: string, limit: number = 10): Promise<IGiphyResponse> =>
  new Promise((resolve, reject) => {
    const req = new XMLHttpRequest();
    req.open(
      'GET',
      `https://api.giphy.com/v1/gifs/search?limit=${limit}&rating=g&q=${searchQuery}&api_key=${process.env.GIPHY_TOKEN}`
    );
    req.send();
    req.onload = () => {
      if (req.status >= 200 && req.status < 300) {
        resolve(JSON.parse(req.response));
      } else {
        reject(new Error(req.statusText));
      }
    };
    req.onerror = () => reject(new Error(req.statusText));
    req.onabort = () => reject(new Error('cancelled'));
  });
