import { Col, Progress, Row, Statistic } from 'antd';
import { useTranslation } from 'react-i18next';
import { GroupMembershipStatus } from '@avtoschoole/shared';
import { useLedgerForGroupQuery } from '../../app/api/billingApi';

/**
 * Aggregate total/collected/remaining across every ACTIVE student in a group - derived from the
 * same ledger data as the per-student billing table, never a separately-computed figure. Members
 * who were removed (expelled or given to another branch) are excluded from the aggregate even
 * though the billing table below still lists them for payment-history purposes - otherwise the
 * group's expected total keeps growing forever with people who are no longer actually enrolled.
 */
export function GroupFinanceStats({ groupId }: { groupId: string }) {
  const { t } = useTranslation();
  const { data: ledgerRows, isLoading } = useLedgerForGroupQuery(groupId, { skip: !groupId });

  const totals = (ledgerRows ?? [])
    .filter((row) => row.status === GroupMembershipStatus.ACTIVE)
    .reduce(
      (acc, row) => ({
        totalAmount: acc.totalAmount + row.totalAmount,
        paidAmount: acc.paidAmount + row.paidAmount,
        remainingBalance: acc.remainingBalance + row.remainingBalance,
      }),
      { totalAmount: 0, paidAmount: 0, remainingBalance: 0 },
    );
  const percentPaid = totals.totalAmount > 0 ? Math.round((totals.paidAmount / totals.totalAmount) * 100) : 0;

  if (isLoading) {
    return null;
  }

  return (
    <div>
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={8}>
          <Statistic title={t('billing.totalAmount')} value={totals.totalAmount} suffix={t('billing.currency')} />
        </Col>
        <Col xs={24} sm={8}>
          <Statistic
            title={t('dashboard.collected')}
            value={totals.paidAmount}
            valueStyle={{ color: '#3f8600' }}
            suffix={t('billing.currency')}
          />
        </Col>
        <Col xs={24} sm={8}>
          <Statistic
            title={t('dashboard.remaining')}
            value={totals.remainingBalance}
            valueStyle={{ color: totals.remainingBalance > 0 ? '#cf1322' : '#3f8600' }}
            suffix={t('billing.currency')}
          />
        </Col>
      </Row>
      <Progress percent={percentPaid} style={{ marginTop: 24 }} strokeColor="#52c41a" />
    </div>
  );
}
