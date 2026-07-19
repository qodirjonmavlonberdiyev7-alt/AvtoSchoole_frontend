import { useState } from 'react';
import { Badge, Button, Card, Empty, Pagination, Segmented, Space, Typography, theme } from 'antd';
import { CheckOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import {
  useMarkAllNotificationsReadMutation,
  useMarkNotificationReadMutation,
  useMyNotificationsQuery,
} from '../../app/api/notificationsApi';

const PAGE_SIZE = 10;

export function NotificationsPage() {
  const { t } = useTranslation();
  const { token } = theme.useToken();
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const { data, isLoading } = useMyNotificationsQuery({ page, limit: PAGE_SIZE, unreadOnly: filter === 'unread' });
  const [markRead] = useMarkNotificationReadMutation();
  const [markAllRead] = useMarkAllNotificationsReadMutation();

  const items = data?.items ?? [];

  return (
    <div>
      <Space style={{ width: '100%', justifyContent: 'space-between', marginBottom: 16 }} wrap>
        <Typography.Title level={4} style={{ margin: 0 }}>
          {t('notifications.title')}
        </Typography.Title>
        <Space>
          <Segmented
            value={filter}
            onChange={(value) => {
              setFilter(value as 'all' | 'unread');
              setPage(1);
            }}
            options={[
              { value: 'all', label: t('notifications.filterAll') },
              { value: 'unread', label: t('notifications.filterUnread') },
            ]}
          />
          <Button icon={<CheckOutlined />} onClick={() => markAllRead()}>
            {t('notifications.markAllRead')}
          </Button>
        </Space>
      </Space>

      {!isLoading && items.length === 0 && <Empty description={t('notifications.empty')} />}

      <Space direction="vertical" style={{ width: '100%' }} size={12}>
        {items.map((item) => (
          <Card
            key={item.id}
            size="small"
            onClick={() => !item.isRead && markRead(item.id)}
            style={{
              cursor: item.isRead ? 'default' : 'pointer',
              borderInlineStart: `3px solid ${item.isRead ? token.colorBorderSecondary : token.colorWarning}`,
            }}
          >
            <Space style={{ width: '100%', justifyContent: 'space-between' }} align="start">
              <div>
                <Typography.Text strong={!item.isRead}>{t(`notifications.type.${item.type}`)}</Typography.Text>
                <div>
                  <Typography.Text type="secondary">{item.message}</Typography.Text>
                </div>
                <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                  {new Date(item.createdAt).toLocaleString()}
                </Typography.Text>
              </div>
              {!item.isRead && <Badge status="warning" />}
            </Space>
          </Card>
        ))}
      </Space>

      {(data?.total ?? 0) > PAGE_SIZE && (
        <div style={{ textAlign: 'center', marginTop: 24 }}>
          <Pagination
            current={page}
            pageSize={PAGE_SIZE}
            total={data?.total ?? 0}
            onChange={setPage}
            showSizeChanger={false}
          />
        </div>
      )}
    </div>
  );
}
