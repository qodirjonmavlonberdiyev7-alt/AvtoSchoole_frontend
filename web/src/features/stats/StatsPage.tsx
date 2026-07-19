import { Col, Row, Space, Table, Typography, theme } from 'antd';
import { DollarOutlined, ExportOutlined, FallOutlined, ImportOutlined, RiseOutlined, UserAddOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useStatsOverviewQuery } from '../../app/api/statsApi';
import { MetricBarChart } from '../../shared/components/MetricBarChart';
import { ExportExcelButton } from '../../shared/components/ExportExcelButton';
import { exportToExcel } from '../../shared/utils/exportExcel';

interface OverviewRow {
  key: string;
  label: string;
  values?: { week: number; month: number; year: number };
}

export function StatsPage() {
  const { t } = useTranslation();
  const { token } = theme.useToken();
  const { data: overview, isLoading: isLoadingOverview } = useStatsOverviewQuery();

  const overviewRows: OverviewRow[] = [
    { key: 'studentsJoined', label: t('stats.studentsJoined'), values: overview?.studentsJoined },
    { key: 'paymentsTotal', label: t('stats.paymentsTotal'), values: overview?.paymentsTotal },
    { key: 'transfersGiven', label: t('stats.transfersGiven'), values: overview?.transfersGiven },
    { key: 'transfersReceived', label: t('stats.transfersReceived'), values: overview?.transfersReceived },
    { key: 'cashIncome', label: t('stats.cashIncome'), values: overview?.cashIncome },
    { key: 'cashExpense', label: t('stats.cashExpense'), values: overview?.cashExpense },
  ];

  const handleExport = async () => {
    await exportToExcel(t('stats.title'), [
      {
        name: t('stats.title'),
        columns: [
          { header: t('stats.metric'), key: 'label', value: (r: OverviewRow) => r.label },
          { header: t('stats.thisWeek'), key: 'week', value: (r: OverviewRow) => r.values?.week ?? 0 },
          { header: t('stats.thisMonth'), key: 'month', value: (r: OverviewRow) => r.values?.month ?? 0 },
          { header: t('stats.thisYear'), key: 'year', value: (r: OverviewRow) => r.values?.year ?? 0 },
        ],
        rows: overviewRows,
      },
    ]);
  };

  return (
    <div>
      <Space style={{ marginBottom: 16, width: '100%', justifyContent: 'space-between' }}>
        <Typography.Title level={4} style={{ margin: 0 }}>
          {t('stats.title')}
        </Typography.Title>
        <ExportExcelButton onExport={handleExport} disabled={!overview} />
      </Space>

      <Table
        rowKey="key"
        dataSource={overviewRows}
        loading={isLoadingOverview}
        pagination={false}
        scroll={{ x: true }}
        style={{ marginBottom: 24 }}
        columns={[
          { title: t('stats.metric'), dataIndex: 'label' },
          { title: t('stats.thisWeek'), render: (_, row) => row.values?.week ?? 0 },
          { title: t('stats.thisMonth'), render: (_, row) => row.values?.month ?? 0 },
          { title: t('stats.thisYear'), render: (_, row) => row.values?.year ?? 0 },
        ]}
      />

      <Typography.Title level={5} style={{ marginBottom: 16 }}>
        {t('stats.chartTitle')}
      </Typography.Title>
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <MetricBarChart
            title={t('stats.studentsJoined')}
            values={overview?.studentsJoined}
            color={token.colorPrimary}
            icon={<UserAddOutlined />}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <MetricBarChart
            title={t('stats.paymentsTotal')}
            values={overview?.paymentsTotal}
            color="#52c41a"
            icon={<DollarOutlined />}
            suffix={t('billing.currency')}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <MetricBarChart
            title={t('stats.transfersGiven')}
            values={overview?.transfersGiven}
            color="#fa8c16"
            icon={<ExportOutlined />}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <MetricBarChart
            title={t('stats.transfersReceived')}
            values={overview?.transfersReceived}
            color="#722ed1"
            icon={<ImportOutlined />}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <MetricBarChart
            title={t('stats.cashIncome')}
            values={overview?.cashIncome}
            color="#3f8600"
            icon={<RiseOutlined />}
            suffix={t('billing.currency')}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <MetricBarChart
            title={t('stats.cashExpense')}
            values={overview?.cashExpense}
            color="#cf1322"
            icon={<FallOutlined />}
            suffix={t('billing.currency')}
          />
        </Col>
      </Row>
    </div>
  );
}
