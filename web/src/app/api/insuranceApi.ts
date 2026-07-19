import type { UserDto } from '@avtoschoole/shared';
import { api } from './baseApi';

export interface InsuranceRecord {
  id: string;
  teacherId: string;
  insuredAt: string;
  expiresAt: string;
  phone: string;
  fullName: string;
  carBrand: string;
  plateNumber: string;
  createdAt: string;
  teacher?: UserDto;
}

interface CreateInsuranceBody {
  insuredAt: string;
  expiresAt: string;
  phone: string;
  fullName: string;
  carBrand: string;
  plateNumber: string;
}

type UpdateInsuranceBody = Partial<CreateInsuranceBody>;

export const insuranceApi = api.injectEndpoints({
  endpoints: (builder) => ({
    myInsurance: builder.query<InsuranceRecord[], void>({
      query: () => '/insurance/my',
      providesTags: ['Insurance'],
    }),
    allInsurance: builder.query<InsuranceRecord[], void>({
      query: () => '/insurance',
      providesTags: ['Insurance'],
    }),
    createInsurance: builder.mutation<InsuranceRecord, CreateInsuranceBody>({
      query: (body) => ({ url: '/insurance', method: 'POST', body }),
      invalidatesTags: ['Insurance'],
    }),
    updateInsurance: builder.mutation<InsuranceRecord, { id: string; body: UpdateInsuranceBody }>({
      query: ({ id, body }) => ({ url: `/insurance/${id}`, method: 'PATCH', body }),
      invalidatesTags: ['Insurance'],
    }),
    deleteInsurance: builder.mutation<void, string>({
      query: (id) => ({ url: `/insurance/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Insurance'],
    }),
  }),
});

export const {
  useMyInsuranceQuery,
  useAllInsuranceQuery,
  useCreateInsuranceMutation,
  useUpdateInsuranceMutation,
  useDeleteInsuranceMutation,
} = insuranceApi;
