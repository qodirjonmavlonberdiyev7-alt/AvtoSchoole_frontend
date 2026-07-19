import { useEffect, useState } from 'react';
import { Card, Empty, Select, Typography } from 'antd';
import { useTranslation } from 'react-i18next';
import { Role } from '@avtoschoole/shared';
import { useAppSelector } from '../../app/hooks';
import { useMyGroupsQuery } from '../../app/api/groupsApi';
import { ScheduleManager } from './ScheduleManager';

export function MySchedulePage() {
  const { t } = useTranslation();
  const currentUser = useAppSelector((state) => state.auth.user);
  const canManage = currentUser?.role === Role.TEACHER;
  const { data: groups, isLoading } = useMyGroupsQuery();
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);

  useEffect(() => {
    if (groups && groups.length > 0 && !groups.some((g) => g.id === selectedGroupId)) {
      setSelectedGroupId(groups[0].id);
    }
  }, [groups, selectedGroupId]);

  if (!canManage) {
    return (
      <div>
        <Typography.Title level={4}>{t('schedule.title')}</Typography.Title>
        {!isLoading && (groups?.length ?? 0) === 0 && <Empty description={t('dashboard.noGroups')} />}
        {groups?.map((group) => (
          <Card key={group.id} title={group.name} style={{ marginBottom: 16 }}>
            <ScheduleManager groupId={group.id} canManage={false} />
          </Card>
        ))}
      </div>
    );
  }

  const selectedGroup = groups?.find((g) => g.id === selectedGroupId);

  return (
    <div>
      <Typography.Title level={4} style={{ marginBottom: 16 }}>
        {t('schedule.title')}
      </Typography.Title>

      {!isLoading && (groups?.length ?? 0) === 0 && <Empty description={t('dashboard.noGroups')} />}

      {(groups?.length ?? 0) > 0 && (
        <>
          <Select
            style={{ width: 280, marginBottom: 16 }}
            value={selectedGroupId ?? undefined}
            onChange={setSelectedGroupId}
            options={groups?.map((g) => ({ value: g.id, label: g.name }))}
          />
          {selectedGroup && (
            <Card title={selectedGroup.name}>
              <ScheduleManager groupId={selectedGroup.id} canManage />
            </Card>
          )}
        </>
      )}
    </div>
  );
}
