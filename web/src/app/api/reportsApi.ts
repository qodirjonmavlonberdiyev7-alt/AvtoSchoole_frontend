import { api } from './baseApi';

export interface ReportEntry {
  id: string;
  teacherId: string;
  date: string;
  note: string | null;
  images: string[];
  createdAt: string;
}

/** Backend serves report photos as static files outside the /api prefix - see main.ts / ReportsController. */
const API_ORIGIN = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/api\/?$/, '');

export function getReportImageUrl(filename: string): string {
  return `${API_ORIGIN}/uploads/reports/${filename}`;
}

export const reportsApi = api.injectEndpoints({
  endpoints: (builder) => ({
    myReports: builder.query<ReportEntry[], void>({
      query: () => '/reports/my',
      providesTags: ['Report'],
    }),
    createReport: builder.mutation<ReportEntry, FormData>({
      query: (body) => ({ url: '/reports', method: 'POST', body }),
      invalidatesTags: ['Report'],
    }),
    updateReport: builder.mutation<ReportEntry, { id: string; body: FormData }>({
      query: ({ id, body }) => ({ url: `/reports/${id}`, method: 'PATCH', body }),
      invalidatesTags: ['Report'],
    }),
    deleteReport: builder.mutation<void, string>({
      query: (id) => ({ url: `/reports/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Report'],
    }),
  }),
});

export const { useMyReportsQuery, useCreateReportMutation, useUpdateReportMutation, useDeleteReportMutation } =
  reportsApi;
