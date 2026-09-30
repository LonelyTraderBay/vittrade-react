import { setupWorker } from 'msw/browser';
import { handlers } from './handlers';
import { previewScenarioHandler } from './preview-scenario-handler';
export { onUnhandledRequest } from './browser-policy';

export const worker = setupWorker(previewScenarioHandler, ...handlers);
