/**
 * @file urlSearchParams.ts
 * @description this is helper service to import URLSearchParams instead of creating it in every place
 * we need it
 */
const urlSearchParams: URLSearchParams = new URLSearchParams(window.location.search);
export default urlSearchParams;
