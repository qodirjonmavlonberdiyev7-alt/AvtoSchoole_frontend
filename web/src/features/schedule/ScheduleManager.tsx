import { useMemo, useState } from 'react';
import { Button, Card, DatePicker, Form, Input, Modal, Popconfirm, Space, Table, TimePicker, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { DeleteOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';
import {
  useAddScheduleEntryMutation,
  useListScheduleQuery,
  useRemoveScheduleEntryMutation,
  useUpdateScheduleEntryMutation,
  type ScheduleEntry,
} from '../../app/api/scheduleApi';
import { notifyError, notifySuccess } from '../../shared/utils/notify';

const WEEKDAY_KEYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

/** dayjs `.day()` is 0=Sunday..6=Saturday; remaps to an index into WEEKDAY_KEYS (0=Monday..6=Sunday). */
function weekdayKey(date: string): string {
  const dow = dayjs(date).day();
  return WEEKDAY_KEYS[dow === 0 ? 6 : dow - 1];
}

/** Monday-Sunday boundaries (as plain ISO date strings, so entries can be range-filtered by simple string comparison) of the week containing `today`. */
function currentWeekRange(today: dayjs.Dayjs) {
  const dow = today.day();
  const daysSinceMonday = dow === 0 ? 6 : dow - 1;
  const start = today.subtract(daysSinceMonday, 'day');
  const end = start.add(6, 'day');
  return { start, end };
}

interface SlotValue {
  time: [dayjs.Dayjs, dayjs.Dayjs];
  topic: string;
}

interface AddFormValues {
  date: dayjs.Dayjs;
  slots: SlotValue[];
}

interface EditFormValues {
  date: dayjs.Dayjs;
  time: [dayjs.Dayjs, dayjs.Dayjs];
  topic: string;
}

/** One table row - either a real lesson slot, or a placeholder for a day with nothing scheduled yet. */
type ScheduleRow = { key: string; date: string; entry: ScheduleEntry | null };

/**
 * Lesson schedule for one group, scoped to the current calendar week - a group's real weekly
 * schedule shifts week to week, so entries are dated (not a recurring weekday template) and only
 * this week's entries show by default; once the week passes, the teacher fills in fresh ones.
 * Read-only for students, full CRUD for the teacher.
 */
export function ScheduleManager({ groupId, canManage }: { groupId: string; canManage: boolean }) {
  const { t } = useTranslation();
  const { data: entries, isLoading } = useListScheduleQuery(groupId);
  const [addEntry, { isLoading: isAdding }] = useAddScheduleEntryMutation();
  const [updateEntry, { isLoading: isUpdating }] = useUpdateScheduleEntryMutation();
  const [removeEntry] = useRemoveScheduleEntryMutation();
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<ScheduleEntry | null>(null);
  const [addForm] = Form.useForm<AddFormValues>();
  const [editForm] = Form.useForm<EditFormValues>();

  const { start: weekStart, end: weekEnd } = useMemo(() => currentWeekRange(dayjs()), []);
  const weekStartStr = weekStart.format('YYYY-MM-DD');
  const weekEndStr = weekEnd.format('YYYY-MM-DD');

  const openAddModal = (forDate?: dayjs.Dayjs) => {
    addForm.resetFields();
    addForm.setFieldsValue({ date: forDate ?? dayjs(), slots: [{}] as unknown as SlotValue[] });
    setAddModalOpen(true);
  };

  const openEditModal = (entry: ScheduleEntry) => {
    setEditingEntry(entry);
    editForm.setFieldsValue({
      date: dayjs(entry.date),
      time: [dayjs(entry.startTime, 'HH:mm'), dayjs(entry.endTime, 'HH:mm')],
      topic: entry.topic ?? '',
    });
  };

  const handleAddSubmit = async (values: AddFormValues) => {
    try {
      await Promise.all(
        values.slots.map((slot) =>
          addEntry({
            groupId,
            body: {
              date: values.date.format('YYYY-MM-DD'),
              startTime: slot.time[0].format('HH:mm'),
              endTime: slot.time[1].format('HH:mm'),
              topic: slot.topic,
            },
          }).unwrap(),
        ),
      );
      notifySuccess(t('notify.scheduleAdded'));
      setAddModalOpen(false);
      addForm.resetFields();
    } catch {
      notifyError(t('notify.scheduleAddFailed'));
    }
  };

  const handleEditSubmit = async (values: EditFormValues) => {
    if (!editingEntry) return;
    try {
      await updateEntry({
        groupId,
        entryId: editingEntry.id,
        body: {
          date: values.date.format('YYYY-MM-DD'),
          startTime: values.time[0].format('HH:mm'),
          endTime: values.time[1].format('HH:mm'),
          topic: values.topic,
        },
      }).unwrap();
      notifySuccess(t('notify.scheduleUpdated'));
      setEditingEntry(null);
    } catch {
      notifyError(t('notify.scheduleUpdateFailed'));
    }
  };

  const handleRemove = async (entryId: string) => {
    try {
      await removeEntry({ groupId, entryId }).unwrap();
      notifySuccess(t('notify.scheduleRemoved'));
    } catch {
      notifyError(t('notify.scheduleRemoveFailed'));
    }
  };

  /** Only this week's entries - last week's plan naturally drops off (and is purged server-side), this week's is filled in fresh. */
  const weekEntries = useMemo(
    () => (entries ?? []).filter((e) => e.date >= weekStartStr && e.date <= weekEndStr),
    [entries, weekStartStr, weekEndStr],
  );

  /** All 7 days always show, even with nothing scheduled yet - a full week at a glance instead of an easy-to-miss partial list. */
  const rows: ScheduleRow[] = useMemo(() => {
    const result: ScheduleRow[] = [];
    for (let i = 0; i < 7; i += 1) {
      const dateStr = weekStart.add(i, 'day').format('YYYY-MM-DD');
      const dayEntries = weekEntries
        .filter((e) => e.date === dateStr)
        .sort((a, b) => a.startTime.localeCompare(b.startTime));
      if (dayEntries.length === 0) {
        result.push({ key: `empty-${dateStr}`, date: dateStr, entry: null });
      } else {
        dayEntries.forEach((entry) => result.push({ key: entry.id, date: dateStr, entry }));
      }
    }
    return result;
  }, [weekStart, weekEntries]);

  const dateRowSpans = useMemo(() => {
    const spans: number[] = [];
    rows.forEach((row, index) => {
      if (index === 0 || row.date !== rows[index - 1].date) {
        spans.push(rows.filter((r) => r.date === row.date).length);
      } else {
        spans.push(0);
      }
    });
    return spans;
  }, [rows]);

  const columns: ColumnsType<ScheduleRow> = [
    {
      title: t('schedule.date'),
      render: (_, row) => (
        <Space direction="vertical" size={0}>
          <Typography.Text strong>{dayjs(row.date).format('DD.MM.YYYY')}</Typography.Text>
          <Typography.Text type="secondary">{t(`schedule.weekday.${weekdayKey(row.date)}`)}</Typography.Text>
        </Space>
      ),
      onCell: (_, index) => ({ rowSpan: dateRowSpans[index ?? 0] }),
    },
    {
      title: t('schedule.time'),
      render: (_, row) =>
        row.entry ? `${row.entry.startTime} - ${row.entry.endTime}` : <Typography.Text type="secondary">{t('schedule.noLesson')}</Typography.Text>,
    },
    { title: t('schedule.topic'), render: (_, row) => row.entry?.topic ?? '-' },
  ];

  if (canManage) {
    columns.push({
      title: t('common.actions'),
      render: (_, row) =>
        row.entry && (
          <Space onClick={(event) => event.stopPropagation()}>
            <Button size="small" icon={<EditOutlined />} onClick={() => openEditModal(row.entry as ScheduleEntry)} />
            <Popconfirm title={t('common.deleteConfirm')} onConfirm={() => handleRemove((row.entry as ScheduleEntry).id)}>
              <Button danger size="small" icon={<DeleteOutlined />} />
            </Popconfirm>
          </Space>
        ),
    });
  }

  return (
    <div>
      <Space style={{ marginBottom: 16, width: '100%', justifyContent: 'space-between' }} wrap>
        <Typography.Text type="secondary">
          {t('schedule.currentWeek')}: {weekStart.format('DD.MM')} - {weekEnd.format('DD.MM')}
        </Typography.Text>
        {canManage && (
          <Button icon={<PlusOutlined />} onClick={() => openAddModal()}>
            {t('schedule.addEntry')}
          </Button>
        )}
      </Space>

      <Table<ScheduleRow>
        rowKey="key"
        columns={columns}
        dataSource={rows}
        loading={isLoading}
        pagination={false}
        scroll={{ x: true }}
        onRow={(row) =>
          canManage && !row.entry
            ? { onClick: () => openAddModal(dayjs(row.date)), style: { cursor: 'pointer' } }
            : {}
        }
      />

      <Modal
        title={t('schedule.addEntry')}
        open={addModalOpen}
        onCancel={() => setAddModalOpen(false)}
        onOk={() => addForm.submit()}
        confirmLoading={isAdding}
        okText={t('common.save')}
        cancelText={t('common.cancel')}
        destroyOnClose
        width={600}
      >
        <Form<AddFormValues>
          form={addForm}
          layout="vertical"
          onFinish={handleAddSubmit}
          initialValues={{ date: dayjs(), slots: [{}] }}
        >
          <Form.Item name="date" label={t('schedule.date')} rules={[{ required: true }]}>
            <DatePicker style={{ width: '100%' }} format="DD.MM.YYYY" />
          </Form.Item>

          <Form.List name="slots">
            {(fields, { add, remove }) => (
              <>
                {fields.map((field, index) => (
                  <Card
                    key={field.key}
                    size="small"
                    style={{ marginBottom: 12 }}
                    title={`${t('schedule.topic')} ${index + 1}`}
                    extra={
                      fields.length > 1 && (
                        <Button
                          type="text"
                          danger
                          size="small"
                          icon={<DeleteOutlined />}
                          onClick={() => remove(field.name)}
                        />
                      )
                    }
                  >
                    <Form.Item
                      name={[field.name, 'time']}
                      label={t('schedule.time')}
                      rules={[{ required: true }]}
                      style={{ marginBottom: 12 }}
                    >
                      <TimePicker.RangePicker format="HH:mm" style={{ width: '100%' }} />
                    </Form.Item>
                    <Form.Item
                      name={[field.name, 'topic']}
                      label={t('schedule.topic')}
                      rules={[{ required: true }]}
                      style={{ marginBottom: 0 }}
                    >
                      <Input placeholder={t('schedule.topicPlaceholder') ?? ''} />
                    </Form.Item>
                  </Card>
                ))}
                <Button block icon={<PlusOutlined />} onClick={() => add()}>
                  {t('schedule.addSlot')}
                </Button>
              </>
            )}
          </Form.List>
        </Form>
      </Modal>

      <Modal
        title={t('schedule.editEntry')}
        open={editingEntry !== null}
        onCancel={() => setEditingEntry(null)}
        onOk={() => editForm.submit()}
        confirmLoading={isUpdating}
        okText={t('common.save')}
        cancelText={t('common.cancel')}
        destroyOnClose
      >
        <Form<EditFormValues> form={editForm} layout="vertical" onFinish={handleEditSubmit}>
          <Form.Item name="date" label={t('schedule.date')} rules={[{ required: true }]}>
            <DatePicker style={{ width: '100%' }} format="DD.MM.YYYY" />
          </Form.Item>
          <Form.Item name="time" label={t('schedule.time')} rules={[{ required: true }]}>
            <TimePicker.RangePicker format="HH:mm" style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="topic" label={t('schedule.topic')} rules={[{ required: true }]}>
            <Input placeholder={t('schedule.topicPlaceholder') ?? ''} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
