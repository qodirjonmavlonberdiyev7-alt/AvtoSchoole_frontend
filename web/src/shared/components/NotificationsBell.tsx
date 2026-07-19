import { useState } from 'react';
import { Badge, Button, Empty, List, Popover, Typography } from 'antd';
import { BellOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import {
  useMarkAllNotificationsReadMutation,
  useMarkNotificationReadMutation,
  useMyNotificationsQuery,
  useUnreadNotificationCountQuery,
} from '../../app/api/notificationsApi';

export function NotificationsBell() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const { data: unread } = useUnreadNotificationCountQuery(undefined, { pollingInterval: 60000 });
  const { data: notifications } = useMyNotificationsQuery({ page: 1, limit: 20, unreadOnly: true });
  const [markRead] = useMarkNotificationReadMutation();
  const [markAllRead] = useMarkAllNotificationsReadMutation();

  const items = notifications?.items ?? [];

  const goToAllNotifications = () => {
    setOpen(false);
    navigate('/notifications');
  };

  const content = (
    <div style={{ width: 320, maxHeight: 400, overflowY: 'auto' }}>
      {items.length ? (
        <>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
            <Button size="small" type="link" onClick={() => markAllRead()}>
              {t('notifications.markAllRead')}
            </Button>
          </div>
          <List
            size="small"
            dataSource={items}
            renderItem={(item) => (
              <List.Item onClick={() => markRead(item.id)} style={{ cursor: 'pointer', padding: '8px 4px' }}>
                <List.Item.Meta
                  title={<Typography.Text strong>{t(`notifications.type.${item.type}`)}</Typography.Text>}
                  description={item.message}
                />
              </List.Item>
            )}
          />
        </>
      ) : (
        <Empty description={t('notifications.empty')} image={Empty.PRESENTED_IMAGE_SIMPLE} />
      )}
      <Button type="link" block onClick={goToAllNotifications} style={{ marginTop: 8 }}>
        {t('notifications.viewAll')}
      </Button>
    </div>
  );

  return (
    <Popover
      content={content}
      title={t('notifications.title')}
      trigger="click"
      placement="bottomRight"
      open={open}
      onOpenChange={setOpen}
    >
      <Badge count={unread?.count ?? 0} size="small" offset={[-2, 2]}>
        <BellOutlined style={{ fontSize: 18, cursor: 'pointer' }} />
      </Badge>
    </Popover>
  );
}
