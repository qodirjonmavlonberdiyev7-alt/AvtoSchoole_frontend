import { api } from './baseApi';

export interface ScheduleEntry {
  id: string;
  teacherId: string;
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
    listSchedule: builder.query<ScheduleEntry[], void>({
      query: () => '/schedule/my',
      providesTags: ['Schedule'],
    }),
    addScheduleEntry: builder.mutation<ScheduleEntry, CreateScheduleEntryBody>({
      query: (body) => ({ url: '/schedule', method: 'POST', body }),
      invalidatesTags: ['Schedule'],
    }),
    updateScheduleEntry: builder.mutation<ScheduleEntry, { entryId: string; body: UpdateScheduleEntryBody }>({
      query: ({ entryId, body }) => ({ url: `/schedule/${entryId}`, method: 'PATCH', body }),
      invalidatesTags: ['Schedule'],
    }),
    removeScheduleEntry: builder.mutation<void, string>({
      query: (entryId) => ({ url: `/schedule/${entryId}`, method: 'DELETE' }),
      invalidatesTags: ['Schedule'],
    }),
  }),
});

export const {
  useListScheduleQuery,
  useAddScheduleEntryMutation,
  useUpdateScheduleEntryMutation,
  useRemoveScheduleEntryMutation,
} = scheduleApi;
