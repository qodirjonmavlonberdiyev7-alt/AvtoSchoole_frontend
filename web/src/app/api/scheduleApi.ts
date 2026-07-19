import { api } from './baseApi';

export interface ScheduleEntry {
  id: string;
  groupId: string;
  date: string;
  startTime: string;
  endTime: string;
  topic: string | null;
}

interface CreateScheduleEntryBody {
  date: string;
  startTime: string;
  endTime: string;
  topic: string;
}

type UpdateScheduleEntryBody = Partial<CreateScheduleEntryBody>;

export const scheduleApi = api.injectEndpoints({
  endpoints: (builder) => ({
    listSchedule: builder.query<ScheduleEntry[], string>({
      query: (groupId) => `/groups/${groupId}/schedule`,
      providesTags: (_result, _error, groupId) => [{ type: 'Schedule', id: groupId }],
    }),
    addScheduleEntry: builder.mutation<ScheduleEntry, { groupId: string; body: CreateScheduleEntryBody }>({
      query: ({ groupId, body }) => ({ url: `/groups/${groupId}/schedule`, method: 'POST', body }),
      invalidatesTags: (_result, _error, { groupId }) => [{ type: 'Schedule', id: groupId }],
    }),
    updateScheduleEntry: builder.mutation<
      ScheduleEntry,
      { groupId: string; entryId: string; body: UpdateScheduleEntryBody }
    >({
      query: ({ groupId, entryId, body }) => ({
        url: `/groups/${groupId}/schedule/${entryId}`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: (_result, _error, { groupId }) => [{ type: 'Schedule', id: groupId }],
    }),
    removeScheduleEntry: builder.mutation<void, { groupId: string; entryId: string }>({
      query: ({ groupId, entryId }) => ({ url: `/groups/${groupId}/schedule/${entryId}`, method: 'DELETE' }),
      invalidatesTags: (_result, _error, { groupId }) => [{ type: 'Schedule', id: groupId }],
    }),
  }),
});

export const {
  useListScheduleQuery,
  useAddScheduleEntryMutation,
  useUpdateScheduleEntryMutation,
  useRemoveScheduleEntryMutation,
} = scheduleApi;
