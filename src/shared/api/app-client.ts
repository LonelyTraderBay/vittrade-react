import { env } from '../config/env';
import {
  createAppApiClient,
  getAccessToken,
  setAccessToken,
  setUnauthorizedHandler,
} from '../../shared/api/client';

const fallbackBaseUrl =
  typeof window === 'undefined' ? 'http://localhost/api' : `${window.location.origin}/api`;

export { getAccessToken, setAccessToken, setUnauthorizedHandler };
export const apiClient = createAppApiClient(env.apiBaseUrl || fallbackBaseUrl);
