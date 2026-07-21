import { Typography } from 'antd';
import { useTranslation } from 'react-i18next';
import { Role } from '@avtoschoole/shared';
import { useAppSelector } from '../../app/hooks';
import { ScheduleManager } from './ScheduleManager';

/** One shared lesson schedule - same content for the teacher and every one of their students. */
export function MySchedulePage() {
  const { t } = useTranslation();
  const currentUser = useAppSelector((state) => state.auth.user);
  const canManage = currentUser?.role === Role.TEACHER;

  return (
    <div>
      <Typography.Title level={4} style={{ marginBottom: 16 }}>
        {t('schedule.title')}
      </Typography.Title>
      <ScheduleManager canManage={canManage} />
    </div>
  );
}
