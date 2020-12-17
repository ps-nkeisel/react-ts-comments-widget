/**
 * index.ts
 *
 * This is the entry file for the application, only setup and boilerplate
 * code.
 */
import './polyfills';

import * as React from 'react';
import * as ReactDOM from 'react-dom';

import { initializeListener, windowProxy } from 'services/communication';
import { WatchHeight } from 'services/watchHeight';
import widgetStore from 'stores/widgetStore';
import App from './modules/App';

const HTML_NODE = document.querySelector('html');
const BODY_NODE = document.querySelector('body');
const MOUNT_NODE = document.getElementById('app');

/* ========================================================
 * 💅 Global Styles and Theming
======================================================== */
import { generateGlobalStyles, generateTheme } from '@vuukle/widget-theme';
import { ThemeProvider } from 'styled-components';
const theme = generateTheme(widgetStore.theme, widgetStore.language === 'ar');
const GlobalStyles = generateGlobalStyles(theme);

/* ========================================================
 * 🏞️ React App render function
======================================================== */
const render = () =>
  ReactDOM.render(
    <ThemeProvider theme={theme}>
      <div>
        <GlobalStyles />
        <App />
      </div>
    </ThemeProvider>,
    MOUNT_NODE
  );

/* ========================================================
* Detect APP language
======================================================== */
if (HTML_NODE !== null) {
  if (widgetStore.language === 'ar') {
    HTML_NODE.setAttribute('dir', 'rtl');
  }
  if (widgetStore.language !== 'en') {
    HTML_NODE.setAttribute('lang', widgetStore.language);
  }
}

/* ========================================================
* Check for Opera Mini in Saving mode
======================================================== */
if (
  navigator.userAgent.indexOf('Opera Mini') !== -1 ||
  Object.prototype.toString.call((window as any).operamini) === '[object OperaMini]'
) {
  const element = document.createElement('div');
  element.style.border = '1px solid #ffb995';
  element.style.backgroundColor = '#fff8f4';
  element.style.padding = '8px';
  element.style.margin = '10px';
  element.innerHTML = 'Please disable Opera Mini "Saving mode" to have a correct working page and comments widget.';
  // Insert to body
  if (BODY_NODE) {
    BODY_NODE.insertBefore(element, BODY_NODE.firstChild); // insert message
  }
}

/* ========================================================
 ======================================================== */
// 🎨 Render app
render();
// 💬 Listen for messages from porthole
initializeListener();

/* ========================================================
 * 🌐 Translation
 *
 * Since translation can be updated only once we don't use context or store.
 * What we do is just app re-rendering after postMessage is received and
 * translation is updated. We do this to minify codebase, and to simplify translation usage
 * inside components instead of keeping all components connected to the store or context.
 ======================================================== */
import { updateAlertsTranslation } from 'modules/WriteComment/stores/models/CommentBox';
import { updateImageUploadErrorTranslation } from 'modules/WriteComment/stores/models/ImageUpload';
import { updateTranslation } from 'services/translation';

/** 👂 Listen for translation object from platform.js */
windowProxy.addEventListener((event: any) => {
  if (!(event.data instanceof Object)) {
    return; // Message is invalid
  }

  if (event.data.customText instanceof Object) {
    updateTranslation(event.data.customText);
    updateAlertsTranslation();
    updateImageUploadErrorTranslation();
    // 🔁 Rerender our app
    ReactDOM.render(<div />, MOUNT_NODE); // Needed to force re-rendering
    render(); // Now we can render our regular app again
  }
});

/* ========================================================
* 🔁 [DEVELOPMENT] HOT reload
======================================================== */
if ((module as any).hot && process.env.NODE_ENV === 'development' && MOUNT_NODE instanceof HTMLElement) {
  // Hot reloadable React components and translation json files
  // modules.hot.accept does not accept dynamic dependencies,
  // have to be constants at compile-time
  (module as any).hot.accept('./modules/App', () => {
    ReactDOM.unmountComponentAtNode(MOUNT_NODE);
    render();
  });
}

/* ========================================================
 Ohh!😱 And one more... we need to watch height of the app since
 we will be rendered inside iframe
======================================================== */
if (MOUNT_NODE !== null) {
  WatchHeight.init(MOUNT_NODE);
}

/* ========================================================
* and one more... 😃 We need to log widget version
======================================================== */
// tslint:disable-next-line
console.log(
  `%c[VUUKLE] Comments widget initialized! Version: ${process.env.VERSION}. Need help? Reach us at support[at]vuukle[dot]com`,
  'color:#039BE5;'
);
