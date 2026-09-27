import { apiClient } from '@/shared/api/app-client';
import { createAuthApi } from './auth-api';

export const authApi = createAuthApi(apiClient);
