import type { GroupMembershipStatus, GroupStatus, PaginatedResult, UserDto } from '@avtoschoole/shared';
import { api } from './baseApi';

export interface GroupMember {
  id: string;
  groupId: string;
  studentId: string;
  status: GroupMembershipStatus;
  totalAmount: string | number;
  joinedAt: string;
  removedAt: string | null;
  removedReason: string | null;
  student?: UserDto;
}

export interface GroupWithRelations {
  id: string;
  name: string;
  category: string;
  teacherId: string;
  totalAmount: string | number;
  status: GroupStatus;
  startDate: string;
  endDate: string | null;
  telegramLink: string | null;
  instagramLink: string | null;
  teacher?: UserDto;
  members?: GroupMember[];
}

export interface AddStudentToGroupResult {
  member: GroupMember;
}

interface CreateGroupBody {
  name: string;
  category: string;
  totalAmount: number;
  startDate: string;
  endDate: string;
  telegramLink?: string;
  instagramLink?: string;
}

interface UpdateGroupBody {
  name?: string;
  category?: string;
  totalAmount?: number;
  startDate?: string;
  endDate?: string;
  telegramLink?: string;
  instagramLink?: string;
}

interface FindGroupsParams {
  page?: number;
  limit?: number;
  status?: GroupStatus;
}

interface AddStudentBody {
  studentId?: string;
  fullName?: string;
  phone?: string;
  password?: string;
}

export const groupsApi = api.injectEndpoints({
  endpoints: (builder) => ({
    listGroups: builder.query<PaginatedResult<GroupWithRelations>, FindGroupsParams | void>({
      query: (params) => ({ url: '/groups', params: params ?? undefined }),
      providesTags: ['Group'],
    }),
    myGroups: builder.query<GroupWithRelations[], void>({
      query: () => '/groups/my',
      providesTags: ['Group'],
    }),
    listMyStudents: builder.query<UserDto[], void>({
      query: () => '/groups/students',
      providesTags: ['Group'],
    }),
    getGroup: builder.query<GroupWithRelations, string>({
      query: (id) => `/groups/${id}`,
      providesTags: (_result, _error, id) => [{ type: 'Group', id }],
    }),
    createGroup: builder.mutation<GroupWithRelations, CreateGroupBody>({
      query: (body) => ({ url: '/groups', method: 'POST', body }),
      invalidatesTags: ['Group'],
    }),
    updateGroup: builder.mutation<GroupWithRelations, { id: string; body: UpdateGroupBody }>({
      query: ({ id, body }) => ({ url: `/groups/${id}`, method: 'PATCH', body }),
      invalidatesTags: ['Group'],
    }),
    deleteGroup: builder.mutation<void, string>({
      query: (id) => ({ url: `/groups/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Group'],
    }),
    finishGroup: builder.mutation<GroupWithRelations, string>({
      query: (id) => ({ url: `/groups/${id}/finish`, method: 'PATCH' }),
      invalidatesTags: ['Group'],
    }),
    addStudentToGroup: builder.mutation<AddStudentToGroupResult, { groupId: string } & AddStudentBody>({
      query: ({ groupId, ...body }) => ({ url: `/groups/${groupId}/students`, method: 'POST', body }),
      invalidatesTags: ['Group', 'Stats'],
    }),
    removeStudentFromGroup: builder.mutation<GroupMember, { groupId: string; studentId: string; reason?: string }>({
      query: ({ groupId, studentId, reason }) => ({
        url: `/groups/${groupId}/students/${studentId}`,
        method: 'DELETE',
        body: { reason },
      }),
      invalidatesTags: ['Group'],
    }),
    updateStudentInfo: builder.mutation<
      UserDto,
      { groupId: string; studentId: string; fullName?: string; phone?: string }
    >({
      query: ({ groupId, studentId, ...body }) => ({
        url: `/groups/${groupId}/students/${studentId}`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: ['Group'],
    }),
    resetStudentPassword: builder.mutation<void, { groupId: string; studentId: string; newPassword: string }>({
      query: ({ groupId, studentId, newPassword }) => ({
        url: `/groups/${groupId}/students/${studentId}/reset-password`,
        method: 'PATCH',
        body: { newPassword },
      }),
    }),
    getStudentPassword: builder.query<{ password: string | null }, { groupId: string; studentId: string }>({
      query: ({ groupId, studentId }) => `/groups/${groupId}/students/${studentId}/password`,
      // Always fetch fresh when the credentials modal opens rather than serving a stale cached
      // value after the teacher has just changed it.
      keepUnusedDataFor: 0,
    }),
  }),
});

export const {
  useListGroupsQuery,
  useMyGroupsQuery,
  useListMyStudentsQuery,
  useGetGroupQuery,
  useCreateGroupMutation,
  useUpdateGroupMutation,
  useDeleteGroupMutation,
  useFinishGroupMutation,
  useAddStudentToGroupMutation,
  useRemoveStudentFromGroupMutation,
  useUpdateStudentInfoMutation,
  useResetStudentPasswordMutation,
  useGetStudentPasswordQuery,
} = groupsApi;
