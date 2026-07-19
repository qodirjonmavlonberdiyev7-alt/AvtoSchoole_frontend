import type { AdminStatsDto, LoginResponseDto, UserDto } from '@avtoschoole/shared';
import { api } from './baseApi';

interface CreateTeacherBody {
  fullName: string;
  phone: string;
  password: string;
}

export const adminApi = api.injectEndpoints({
  endpoints: (builder) => ({
    listTeachers: builder.query<UserDto[], void>({
      query: () => '/admin/teachers',
      providesTags: ['AdminTeacher'],
    }),
    createTeacher: builder.mutation<UserDto, CreateTeacherBody>({
      query: (body) => ({ url: '/admin/teachers', method: 'POST', body }),
      invalidatesTags: ['AdminTeacher'],
    }),
    getTeacherPassword: builder.query<{ password: string | null }, string>({
      query: (teacherId) => `/admin/teachers/${teacherId}/password`,
      keepUnusedDataFor: 0,
    }),
    setTeacherPassword: builder.mutation<void, { teacherId: string; newPassword: string }>({
      query: ({ teacherId, newPassword }) => ({
        url: `/admin/teachers/${teacherId}/password`,
        method: 'PATCH',
        body: { newPassword },
      }),
    }),
    setTeacherActive: builder.mutation<UserDto, { teacherId: string; isActive: boolean }>({
      query: ({ teacherId, isActive }) => ({
        url: `/admin/teachers/${teacherId}/active`,
        method: 'PATCH',
        body: { isActive },
      }),
      invalidatesTags: ['AdminTeacher'],
    }),
    impersonateTeacher: builder.mutation<LoginResponseDto, string>({
      query: (teacherId) => ({ url: `/admin/teachers/${teacherId}/impersonate`, method: 'POST' }),
    }),
    adminStats: builder.query<AdminStatsDto, void>({
      query: () => '/admin/stats',
    }),
  }),
});

export const {
  useListTeachersQuery,
  useCreateTeacherMutation,
  useGetTeacherPasswordQuery,
  useSetTeacherPasswordMutation,
  useSetTeacherActiveMutation,
  useImpersonateTeacherMutation,
  useAdminStatsQuery,
} = adminApi;
