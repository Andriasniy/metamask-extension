import nock from 'nock';
import Enzyme from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';
import log from 'loglevel';
import { JSDOM } from 'jsdom';

process.env.IN_TEST = true;

global.chrome = { runtime: { id: 'testid' } };

nock.disableNetConnect();
nock.enableNetConnect('localhost');

// catch rejections that are still unhandled when tests exit
const unhandledRejections = new Map();
process.on('unhandledRejection', (reason, promise) => {
  console.log('Unhandled rejection:', reason);
  unhandledRejections.set(promise, reason);
});
process.on('rejectionHandled', (promise) => {
  console.log(`handled: ${unhandledRejections.get(promise)}`);
  unhandledRejections.delete(promise);
});

process.on('exit', () => {
  if (unhandledRejections.size > 0) {
    console.error(`Found ${unhandledRejections.size} unhandled rejections:`);
    for (const reason of unhandledRejections.values()) {
      console.error('Unhandled rejection: ', reason);
    }
    process.exit(1);
  }
});

Enzyme.configure({ adapter: new Adapter() });

log.setDefaultLevel(5);
global.log = log;

//
// polyfills
//

// dom
const jsdom = new JSDOM();
global.window = jsdom.window;

// required by `trezor-connect/node_modules/whatwg-fetch`
global.self = window;
// required by `dom-helpers` and various other libraries
global.document = window.document;
// required by `react-tippy`
global.navigator = window.navigator;
global.Element = window.Element;
// required by `react-popper`
global.HTMLElement = window.HTMLElement;

// required by any components anchored on `popover-content`
const popoverContent = window.document.createElement('div');
popoverContent.setAttribute('id', 'popover-content');
window.document.body.appendChild(popoverContent);

// fetch
// fetch is part of node js in future versions, thus triggering no-shadow
// eslint-disable-next-line no-shadow
const fetch = require('node-fetch');

const { Headers, Request, Response } = fetch;
Object.assign(window, { fetch, Headers, Request, Response });

// localStorage
window.localStorage = {
  removeItem: () => null,
};

// used for native dark/light mode detection
window.matchMedia = () => true;

// override @metamask/logo
window.requestAnimationFrame = () => undefined;

// crypto.getRandomValues
if (!window.crypto) {
  window.crypto = {};
}
if (!window.crypto.getRandomValues) {
  // eslint-disable-next-line node/global-require
  window.crypto.getRandomValues = require('polyfill-crypto.getrandomvalues');
}

// Used to test `clearClipboard` function
if (!window.navigator.clipboard) {
  window.navigator.clipboard = {};
}
if (!window.navigator.clipboard.writeText) {
  window.navigator.clipboard.writeText = () => undefined;
}
