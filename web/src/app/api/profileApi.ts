import type { UserDto } from '@avtoschoole/shared';
import { api } from './baseApi';

interface UpdateProfileBody {
  fullName?: string;
  phone?: string;
}

interface ChangePasswordBody {
  currentPassword: string;
  newPassword: string;
}

/** Profile photos are served as static files outside the /api prefix - see main.ts / ProfileController. */
const API_ORIGIN = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/api\/?$/, '');

export function getAvatarUrl(filename: string): string {
  return `${API_ORIGIN}/uploads/avatars/${filename}`;
}

export const profileApi = api.injectEndpoints({
  endpoints: (builder) => ({
    updateProfile: builder.mutation<UserDto, UpdateProfileBody>({
      query: (body) => ({ url: '/profile', method: 'PATCH', body }),
    }),
    getCurrentPassword: builder.query<{ password: string | null }, void>({
      query: () => '/profile/password',
      // Always fetch fresh when the Profile page opens rather than serving a stale cached value
      // after the password has just been changed.
      keepUnusedDataFor: 0,
    }),
    changePassword: builder.mutation<void, ChangePasswordBody>({
      query: (body) => ({ url: '/profile/password', method: 'PATCH', body }),
    }),
    uploadAvatar: builder.mutation<UserDto, FormData>({
      query: (body) => ({ url: '/profile/avatar', method: 'POST', body }),
    }),
  }),
});

export const {
  useUpdateProfileMutation,
  useGetCurrentPasswordQuery,
  useChangePasswordMutation,
  useUploadAvatarMutation,
} = profileApi;
