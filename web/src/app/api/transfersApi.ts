import type { TransferDirection } from '@avtoschoole/shared';
import { api } from './baseApi';

export interface StudentTransfer {
  id: string;
  teacherId: string;
  direction: TransferDirection;
  branchName: string;
  date: string;
  note: string | null;
  createdAt: string;
  groupStudentId: string;
  student: {
    id: string;
    fullName: string;
    phone: string;
  };
  group: {
    id: string;
    name: string;
    category: string;
    startDate: string;
    endDate: string | null;
    totalAmount: number;
  };
}

export interface CreateTransferResult {
  transfer: StudentTransfer;
}

interface CreateTransferBody {
  direction: TransferDirection;
  branchName: string;
  date: string;
  note?: string;
  /** Link an existing enrollment - typically for "given". */
  groupStudentId?: string;
  /** Enroll inline instead - typically for "received": a group plus an existing or brand-new student. */
  groupId?: string;
  studentId?: string;
  fullName?: string;
  phone?: string;
  password?: string;
}

export const transfersApi = api.injectEndpoints({
  endpoints: (builder) => ({
    myTransfers: builder.query<StudentTransfer[], void>({
      query: () => '/transfers/my',
      providesTags: ['Transfer'],
    }),
    createTransfer: builder.mutation<CreateTransferResult, CreateTransferBody>({
      query: (body) => ({ url: '/transfers', method: 'POST', body }),
      invalidatesTags: ['Transfer', 'Stats', 'Group'],
    }),
    deleteTransfer: builder.mutation<void, string>({
      query: (id) => ({ url: `/transfers/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Transfer', 'Stats'],
    }),
  }),
});

export const { useMyTransfersQuery, useCreateTransferMutation, useDeleteTransferMutation } = transfersApi;
