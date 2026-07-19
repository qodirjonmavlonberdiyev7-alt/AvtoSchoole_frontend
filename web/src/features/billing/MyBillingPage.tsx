import { useMemo, useState } from 'react';
import { DatePicker, Select, Space, Table, Tag, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';
import { PaymentMethod } from '@avtoschoole/shared';
import { useMyLedgersQuery } from '../../app/api/billingApi';

interface FlatTransactionRow {
  id: string;
  groupId: string;
  groupName?: string;
  amount: string | number;
  method: PaymentMethod;
  note: string | null;
  paidAt: string;
}

export function MyBillingPage() {
  const { t } = useTranslation();
  const { data: ledgers, isLoading } = useMyLedgersQuery();
  const [groupFilter, setGroupFilter] = useState<string | undefined>(undefined);
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(null);

  const totalRemaining = useMemo(
    () => (ledgers ?? []).reduce((sum, l) => sum + l.remainingBalance, 0),
    [ledgers],
  );

  const allTransactions: FlatTransactionRow[] = useMemo(() => {
    const rows = (ledgers ?? []).flatMap((l) =>
      l.transactions.map((tx) => ({ ...tx, groupId: l.groupId, groupName: l.groupName })),
    );
    return rows.sort((a, b) => new Date(b.paidAt).getTime() - new Date(a.paidAt).getTime());
  }, [ledgers]);

  const filteredTransactions = allTransactions.filter((row) => {
    if (groupFilter && row.groupId !== groupFilter) return false;
    if (dateRange) {
      const paidAt = dayjs(row.paidAt);
      if (paidAt.isBefore(dateRange[0], 'day') || paidAt.isAfter(dateRange[1], 'day')) return false;
    }
    return true;
  });

  const columns: ColumnsType<FlatTransactionRow> = [
    { title: '#', render: (_, __, index) => index + 1, width: 60 },
    { title: t('billing.amountColumn'), dataIndex: 'amount', render: (v) => `${Number(v).toLocaleString('uz-UZ')} so'm` },
    {
      title: t('common.status'),
      render: () => <Tag color="green">{t('billing.paidStatus')}</Tag>,
    },
    {
      title: t('billing.method'),
      dataIndex: 'method',
      render: (method: PaymentMethod) => (
        <Tag color={method === PaymentMethod.CASH ? 'gold' : 'blue'}>{t(`billing.methodLabel.${method}`)}</Tag>
      ),
    },
    {
      title: t('billing.time'),
      dataIndex: 'paidAt',
      render: (v: string) => new Date(v).toLocaleString(),
    },
  ];

  return (
    <div>
      <Space style={{ marginBottom: 16, width: '100%', justifyContent: 'space-between' }} wrap>
        <Typography.Title level={4} style={{ margin: 0 }}>
          {t('billing.title')}
        </Typography.Title>
        <Tag color={totalRemaining > 0 ? 'red' : 'green'} style={{ fontSize: 14, padding: '4px 12px' }}>
          {t('billing.remainingBalance')}: {totalRemaining.toLocaleString('uz-UZ')} so'm
        </Tag>
      </Space>

      <Space style={{ marginBottom: 16 }} wrap>
        <Select<string | undefined>
          allowClear
          placeholder={t('billing.allGroups')}
          style={{ width: 200 }}
          value={groupFilter}
          onChange={setGroupFilter}
          options={(ledgers ?? []).map((l) => ({ value: l.groupId, label: l.groupName }))}
        />
        <DatePicker.RangePicker
          value={dateRange}
          onChange={(range) => setDateRange(range as [dayjs.Dayjs, dayjs.Dayjs] | null)}
        />
      </Space>

      <Table<FlatTransactionRow>
        rowKey="id"
        loading={isLoading}
        dataSource={filteredTransactions}
        scroll={{ x: true }}
        pagination={{ pageSize: 10 }}
        columns={columns}
      />
    </div>
  );
}
