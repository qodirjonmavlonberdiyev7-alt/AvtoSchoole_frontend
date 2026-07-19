import { api } from './baseApi';

export interface PeriodCounts {
  day: number;
  week: number;
  month: number;
  year: number;
}

export interface StatsOverview {
  studentsJoined: PeriodCounts;
  paymentsTotal: PeriodCounts;
  transfersGiven: PeriodCounts;
  transfersReceived: PeriodCounts;
  cashIncome: PeriodCounts;
  cashExpense: PeriodCounts;
}

export const statsApi = api.injectEndpoints({
  endpoints: (builder) => ({
    statsOverview: builder.query<StatsOverview, void>({
      query: () => '/stats/overview',
      providesTags: ['Stats'],
    }),
  }),
});

export const { useStatsOverviewQuery } = statsApi;
