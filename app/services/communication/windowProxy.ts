/** Porthole Messaging */
declare var Porthole: any;
export let windowProxy: any;

if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'production') {
  windowProxy = new Porthole.WindowProxy(window.location.href);
} else {
  // For test environment
  windowProxy = {
    addEventListener: (data: any) => undefined,
    post: (data: Object) => console.log(data), // tslint:disable-line
  };
}
