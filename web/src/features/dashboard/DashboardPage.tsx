import { useEffect, useState } from 'react';
import { Card, Empty, List, Select, Typography } from 'antd';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Role } from '@avtoschoole/shared';
import { useAppSelector } from '../../app/hooks';
import { useMyGroupsQuery } from '../../app/api/groupsApi';
import { GroupFinanceStats } from '../../shared/components/GroupFinanceStats';

function GroupFinanceSummary() {
  const { t } = useTranslation();
  const { data: groups } = useMyGroupsQuery();
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);

  useEffect(() => {
    if (groups && groups.length > 0 && !groups.some((g) => g.id === selectedGroupId)) {
      setSelectedGroupId(groups[0].id);
    }
  }, [groups, selectedGroupId]);

  if (!groups || groups.length === 0) {
    return null;
  }

  return (
    <Card title={t('dashboard.groupFinance')} style={{ marginTop: 16 }}>
      <Select
        style={{ width: 280, marginBottom: 24 }}
        value={selectedGroupId ?? undefined}
        onChange={setSelectedGroupId}
        options={groups.map((g) => ({ value: g.id, label: g.name }))}
      />
      {selectedGroupId && <GroupFinanceStats groupId={selectedGroupId} />}
    </Card>
  );
}

export function DashboardPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const user = useAppSelector((state) => state.auth.user);
  const { data } = useMyGroupsQuery();

  return (
    <div>
      <Typography.Title level={4}>
        {t('dashboard.welcome')}, {user?.fullName}
      </Typography.Title>

      <Card title={t('dashboard.myGroups')}>
        {data && data.length > 0 ? (
          <List
            dataSource={data}
            renderItem={(group) => (
              <List.Item onClick={() => navigate(`/groups/${group.id}`)} style={{ cursor: 'pointer' }}>
                <List.Item.Meta title={group.name} description={t(`groups.status.${group.status}`)} />
              </List.Item>
            )}
          />
        ) : (
          <Empty description={t('dashboard.noGroups')} />
        )}
      </Card>

      {user?.role === Role.TEACHER && <GroupFinanceSummary />}
    </div>
  );
}
