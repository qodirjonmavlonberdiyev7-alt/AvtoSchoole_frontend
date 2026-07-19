import type { CashflowType } from '@avtoschoole/shared';
import { api } from './baseApi';

export interface CashflowEntry {
  id: string;
  teacherId: string;
  type: CashflowType;
  amount: number;
  date: string;
  note: string | null;
  createdAt: string;
}

interface CreateCashflowEntryBody {
  type: CashflowType;
  amount: number;
  date: string;
  note?: string;
}

type UpdateCashflowEntryBody = Partial<CreateCashflowEntryBody>;

export const cashflowApi = api.injectEndpoints({
  endpoints: (builder) => ({
    myCashflow: builder.query<CashflowEntry[], void>({
      query: () => '/cashflow/my',
      providesTags: ['Cashflow'],
    }),
    createCashflowEntry: builder.mutation<CashflowEntry, CreateCashflowEntryBody>({
      query: (body) => ({ url: '/cashflow', method: 'POST', body }),
      invalidatesTags: ['Cashflow', 'Stats'],
    }),
    updateCashflowEntry: builder.mutation<CashflowEntry, { id: string; body: UpdateCashflowEntryBody }>({
      query: ({ id, body }) => ({ url: `/cashflow/${id}`, method: 'PATCH', body }),
      invalidatesTags: ['Cashflow', 'Stats'],
    }),
    deleteCashflowEntry: builder.mutation<void, string>({
      query: (id) => ({ url: `/cashflow/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Cashflow', 'Stats'],
    }),
  }),
});

export const {
  useMyCashflowQuery,
  useCreateCashflowEntryMutation,
  useUpdateCashflowEntryMutation,
  useDeleteCashflowEntryMutation,
} = cashflowApi;
