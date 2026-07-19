import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { BaseQueryFn, FetchArgs, FetchBaseQueryError } from '@reduxjs/toolkit/query/react';
import type { AuthTokensDto } from '@avtoschoole/shared';
import type { RootState } from '../store';
import { loggedOut, tokensRefreshed } from '../auth/authSlice';
import i18n from '../../shared/i18n/i18n';

const rawBaseQuery = fetchBaseQuery({
  baseUrl: import.meta.env.VITE_API_BASE_URL,
  prepareHeaders: (headers, { getState }) => {
    const token = (getState() as RootState).auth.accessToken;
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
    headers.set('x-lang', i18n.language ?? 'uz');
    return headers;
  },
});

let refreshPromise: Promise<boolean> | null = null;

const isLoginRequest = (args: string | FetchArgs) => typeof args !== 'string' && args.url === '/auth/login';

const baseQueryWithReauth: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> = async (
  args,
  queryApi,
  extraOptions,
) => {
  let result = await rawBaseQuery(args, queryApi, extraOptions);

  if (result.error?.status === 401 && !isLoginRequest(args)) {
    if (!refreshPromise) {
      refreshPromise = (async () => {
        const refreshToken = (queryApi.getState() as RootState).auth.refreshToken;
        if (!refreshToken) {
          return false;
        }
        const refreshResult = await rawBaseQuery(
          { url: '/auth/refresh', method: 'POST', body: { refreshToken } },
          queryApi,
          extraOptions,
        );
        if (refreshResult.data) {
          queryApi.dispatch(tokensRefreshed(refreshResult.data as AuthTokensDto));
          return true;
        }
        queryApi.dispatch(loggedOut());
        // A different account may log in next in the same tab - cached responses are keyed
        // by endpoint+args only (no user id), so a stale-user leak is possible without this.
        queryApi.dispatch(api.util.resetApiState());
        return false;
      })().finally(() => {
        refreshPromise = null;
      });
    }

    const refreshed = await refreshPromise;
    if (refreshed) {
      result = await rawBaseQuery(args, queryApi, extraOptions);
    }
  }

  return result;
};

export const api = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithReauth,
  tagTypes: [
    'Group',
    'Payment',
    'Schedule',
    'Insurance',
    'Notification',
    'Transfer',
    'Stats',
    'Cashflow',
    'Report',
    'Note',
    'AdminTeacher',
  ],
  endpoints: () => ({}),
});
