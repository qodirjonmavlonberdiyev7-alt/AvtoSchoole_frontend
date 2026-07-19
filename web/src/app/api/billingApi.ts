import type { GroupMembershipStatus, PaymentMethod } from '@avtoschoole/shared';
import { api } from './baseApi';

export interface PaymentTransaction {
  id: string;
  groupStudentId: string;
  amount: string | number;
  method: PaymentMethod;
  recordedById: string;
  note: string | null;
  paidAt: string;
}

export interface LedgerSummary {
  groupStudentId: string;
  groupId: string;
  groupName?: string;
  studentId: string;
  status: GroupMembershipStatus;
  totalAmount: number;
  paidAmount: number;
  remainingBalance: number;
}

export interface LedgerDetail extends LedgerSummary {
  transactions: PaymentTransaction[];
}

export const billingApi = api.injectEndpoints({
  endpoints: (builder) => ({
    recordPayment: builder.mutation<
      LedgerDetail,
      { groupStudentId: string; amount: number; method: PaymentMethod; note?: string }
    >({
      query: ({ groupStudentId, ...body }) => ({
        url: `/billing/${groupStudentId}/payments`,
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Payment', 'Group', 'Stats'],
    }),
    getLedger: builder.query<LedgerDetail, string>({
      query: (groupStudentId) => `/billing/${groupStudentId}`,
      providesTags: (_result, _error, groupStudentId) => [{ type: 'Payment', id: groupStudentId }],
    }),
    ledgerForGroup: builder.query<LedgerSummary[], string>({
      query: (groupId) => `/billing/group/${groupId}`,
      providesTags: ['Payment'],
    }),
    myLedgers: builder.query<LedgerDetail[], void>({
      query: () => '/billing/my',
      providesTags: ['Payment'],
    }),
  }),
});

export const { useRecordPaymentMutation, useGetLedgerQuery, useLedgerForGroupQuery, useMyLedgersQuery } = billingApi;
