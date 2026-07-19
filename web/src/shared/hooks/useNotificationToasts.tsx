import { useEffect, useRef } from 'react';
import { notification } from 'antd';
import { useTranslation } from 'react-i18next';
import { useMyNotificationsQuery } from '../../app/api/notificationsApi';

const STORAGE_KEY = 'notifications.toastedIds';
const MAX_STORED_IDS = 200;

function loadToastedIds(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return new Set(raw ? (JSON.parse(raw) as string[]) : []);
  } catch {
    return new Set();
  }
}

function saveToastedIds(ids: Set<string>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(ids).slice(-MAX_STORED_IDS)));
}

/**
 * Surfaces each new unread notification as a toast exactly once (tracked in localStorage,
 * not just `isRead`) - so it never nags on every visit, only when something genuinely new
 * arrives (debt reminder, group ending, insurance expiring, payment received).
 */
export function useNotificationToasts() {
  const { t } = useTranslation();
  const [api, contextHolder] = notification.useNotification();
  const { data } = useMyNotificationsQuery({ page: 1, limit: 20 }, { pollingInterval: 60000 });
  const toastedIds = useRef<Set<string>>(loadToastedIds());

  useEffect(() => {
    if (!data) return;
    const unseen = data.items.filter((item) => !item.isRead && !toastedIds.current.has(item.id));
    if (unseen.length === 0) return;

    unseen.forEach((item) => {
      api.info({
        message: t(`notifications.type.${item.type}`),
        description: item.message,
        placement: 'topRight',
      });
      toastedIds.current.add(item.id);
    });
    saveToastedIds(toastedIds.current);
  }, [data, api, t]);

  return contextHolder;
}
