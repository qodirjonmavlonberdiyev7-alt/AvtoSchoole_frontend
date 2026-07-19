import { useState, type ReactNode } from 'react';
import { Button, Card, DatePicker, Form, Input, InputNumber, Modal, Popconfirm, Space, Table, Tag, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { CheckCircleOutlined, DeleteOutlined, InboxOutlined, PlusOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { GroupStatus } from '@avtoschoole/shared';
import { useCreateGroupMutation, useDeleteGroupMutation, useListGroupsQuery, type GroupWithRelations } from '../../app/api/groupsApi';
import { notifyError, notifySuccess } from '../../shared/utils/notify';
import { ExportExcelButton } from '../../shared/components/ExportExcelButton';
import { exportToExcel } from '../../shared/utils/exportExcel';

/** Small icon-badge for a Card title, matching the visual language already used on the Cashflow/Transfers pages. */
function SectionIcon({ color, icon }: { color: string; icon: ReactNode }) {
  return (
    <span
      style={{
        width: 28,
        height: 28,
        borderRadius: '50%',
        background: `${color}1f`,
        color,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 14,
      }}
    >
      {icon}
    </span>
  );
}

interface GroupFormValues {
  name: string;
  category: string;
  totalAmount: number;
  startDate: dayjs.Dayjs;
  endDate: dayjs.Dayjs;
  telegramLink?: string;
  instagramLink?: string;
}

export function GroupsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data, isLoading } = useListGroupsQuery({ page: 1, limit: 100 });
  const [createGroup, { isLoading: isCreating }] = useCreateGroupMutation();
  const [deleteGroup] = useDeleteGroupMutation();

  const [modalOpen, setModalOpen] = useState(false);
  const [form] = Form.useForm<GroupFormValues>();

  const handleSubmit = async (values: GroupFormValues) => {
    try {
      await createGroup({
        name: values.name,
        category: values.category,
        totalAmount: values.totalAmount,
        startDate: values.startDate.format('YYYY-MM-DD'),
        endDate: values.endDate.format('YYYY-MM-DD'),
        telegramLink: values.telegramLink || undefined,
        instagramLink: values.instagramLink || undefined,
      }).unwrap();
      notifySuccess(t('notify.groupCreated'));
      setModalOpen(false);
      form.resetFields();
    } catch {
      notifyError(t('notify.groupCreateFailed'));
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteGroup(id).unwrap();
      notifySuccess(t('notify.groupDeleted'), t('notify.groupDeletedDesc'));
    } catch {
      notifyError(t('notify.groupDeleteFailed'));
    }
  };

  const columns: ColumnsType<GroupWithRelations> = [
    { title: t('common.name'), dataIndex: 'name' },
    { title: t('groups.category'), dataIndex: 'category', render: (category: string) => <Tag>{category}</Tag> },
    { title: t('billing.totalAmount'), dataIndex: 'totalAmount' },
    { title: t('groups.startDate'), dataIndex: 'startDate' },
    { title: t('groups.endDate'), dataIndex: 'endDate', render: (v) => v ?? '-' },
    {
      title: t('common.actions'),
      render: (_, group) => (
        <Popconfirm
          title={t('groups.deleteConfirm')}
          onConfirm={(e) => {
            e?.stopPropagation();
            handleDelete(group.id);
          }}
        >
          <Button danger size="small" icon={<DeleteOutlined />} onClick={(e) => e.stopPropagation()}>
            {t('common.delete')}
          </Button>
        </Popconfirm>
      ),
    },
  ];

  const activeGroups = (data?.items ?? []).filter((g) => g.status === GroupStatus.ACTIVE);
  const finishedGroups = (data?.items ?? []).filter((g) => g.status === GroupStatus.FINISHED);

  const handleExport = async () => {
    await exportToExcel(t('groups.title'), [
      {
        name: t('groups.title'),
        columns: [
          { header: t('common.name'), key: 'name', value: (g: GroupWithRelations) => g.name },
          { header: t('groups.category'), key: 'category', value: (g: GroupWithRelations) => g.category },
          { header: t('billing.totalAmount'), key: 'totalAmount', value: (g: GroupWithRelations) => Number(g.totalAmount) },
          { header: t('groups.startDate'), key: 'startDate', value: (g: GroupWithRelations) => g.startDate },
          { header: t('groups.endDate'), key: 'endDate', value: (g: GroupWithRelations) => g.endDate ?? '-' },
          {
            header: t('common.status'),
            key: 'status',
            value: (g: GroupWithRelations) => t(`groups.status.${g.status}`),
          },
        ],
        rows: [...activeGroups, ...finishedGroups],
      },
    ]);
  };

  const groupsTable = (items: GroupWithRelations[]) => (
    <Table<GroupWithRelations>
      rowKey="id"
      columns={columns}
      dataSource={items}
      loading={isLoading}
      scroll={{ x: true }}
      pagination={false}
      locale={{ emptyText: t('common.noData') }}
      onRow={(group) => ({ onClick: () => navigate(`/groups/${group.id}`), style: { cursor: 'pointer' } })}
    />
  );

  return (
    <div>
      <Space style={{ marginBottom: 16, width: '100%', justifyContent: 'space-between' }}>
        <Typography.Title level={4} style={{ margin: 0 }}>
          {t('groups.title')}
        </Typography.Title>
        <Space>
          <ExportExcelButton onExport={handleExport} disabled={!data?.items?.length} />
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalOpen(true)}>
            {t('common.create')}
          </Button>
        </Space>
      </Space>

      <Card
        style={{ marginBottom: 16 }}
        title={
          <Space>
            <SectionIcon color="#52c41a" icon={<CheckCircleOutlined />} />
            {t('groups.status.active')}
          </Space>
        }
      >
        {groupsTable(activeGroups)}
      </Card>

      <Card
        title={
          <Space>
            <SectionIcon color="#8c8c8c" icon={<InboxOutlined />} />
            {t('groups.status.finished')}
          </Space>
        }
      >
        {groupsTable(finishedGroups)}
      </Card>

      <Modal
        title={t('groups.createTitle')}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={() => form.submit()}
        confirmLoading={isCreating}
        okText={t('common.save')}
        cancelText={t('common.cancel')}
        destroyOnClose
      >
        <Form<GroupFormValues> form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item name="name" label={t('common.name')} rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="category" label={t('groups.category')} rules={[{ required: true }]}>
            <Input placeholder={t('groups.categoryPlaceholder') ?? ''} />
          </Form.Item>
          <Form.Item name="totalAmount" label={t('billing.totalAmount')} rules={[{ required: true }]}>
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="startDate" label={t('groups.startDate')} rules={[{ required: true }]}>
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="endDate" label={t('groups.endDate')} rules={[{ required: true }]}>
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="telegramLink" label={t('groups.telegramLink')}>
            <Input placeholder="https://t.me/..." />
          </Form.Item>
          <Form.Item name="instagramLink" label={t('groups.instagramLink')}>
            <Input placeholder="https://instagram.com/..." />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
