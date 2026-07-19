import { useState, type ReactNode } from 'react';
import {
  Avatar,
  Button,
  Card,
  DatePicker,
  Form,
  Input,
  Modal,
  Popconfirm,
  Segmented,
  Select,
  Space,
  Table,
  Tag,
  Typography,
  theme,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { DeleteOutlined, ExportOutlined, ImportOutlined, PlusOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';
import { GroupMembershipStatus, TransferDirection } from '@avtoschoole/shared';
import {
  useCreateTransferMutation,
  useDeleteTransferMutation,
  useMyTransfersQuery,
  type StudentTransfer,
} from '../../app/api/transfersApi';
import { useGetGroupQuery, useListMyStudentsQuery, useMyGroupsQuery } from '../../app/api/groupsApi';
import { notifyError, notifySuccess } from '../../shared/utils/notify';
import { ExportExcelButton } from '../../shared/components/ExportExcelButton';
import { exportToExcel } from '../../shared/utils/exportExcel';

/** Merges name+phone into one glanceable identity cell (avatar initials + name + phone) instead of two separate plain-text columns. */
function PersonCell({ fullName, phone }: { fullName: string; phone: string }) {
  const { token } = theme.useToken();
  const initials = fullName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
  return (
    <Space size={10}>
      <Avatar style={{ backgroundColor: token.colorPrimary, flexShrink: 0 }}>{initials}</Avatar>
      <div>
        <div>
          <Typography.Text strong>{fullName}</Typography.Text>
        </div>
        <Typography.Text type="secondary" style={{ fontSize: 12 }}>
          {phone}
        </Typography.Text>
      </div>
    </Space>
  );
}

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

interface TransferFormValues {
  direction: TransferDirection;
  groupId: string;
  mode: 'existing' | 'new';
  groupStudentId?: string;
  studentId?: string;
  fullName?: string;
  phone?: string;
  password?: string;
  branchName: string;
  date: dayjs.Dayjs;
  note?: string;
}

export function TransfersPage() {
  const { t } = useTranslation();
  const { data: transfers, isLoading: isLoadingTransfers } = useMyTransfersQuery();
  const { data: myGroups } = useMyGroupsQuery();
  const { data: allStudents } = useListMyStudentsQuery();
  const [createTransfer, { isLoading: isCreating }] = useCreateTransferMutation();
  const [deleteTransfer] = useDeleteTransferMutation();

  const [modalOpen, setModalOpen] = useState(false);
  const [direction, setDirection] = useState<TransferDirection>(TransferDirection.GIVEN);
  const [mode, setMode] = useState<'existing' | 'new'>('existing');
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const { data: selectedGroup } = useGetGroupQuery(selectedGroupId as string, { skip: !selectedGroupId });
  const [form] = Form.useForm<TransferFormValues>();

  const closeModal = () => {
    setModalOpen(false);
    setSelectedGroupId(null);
    setDirection(TransferDirection.GIVEN);
    setMode('existing');
  };

  const handleSubmit = async (values: TransferFormValues) => {
    try {
      const base = {
        direction: values.direction,
        branchName: values.branchName,
        date: values.date.format('YYYY-MM-DD'),
        note: values.note,
      };
      const payload =
        values.direction === TransferDirection.GIVEN
          ? { ...base, groupStudentId: values.groupStudentId }
          : values.mode === 'existing'
            ? { ...base, groupId: values.groupId, studentId: values.studentId }
            : { ...base, groupId: values.groupId, fullName: values.fullName, phone: values.phone, password: values.password };

      await createTransfer(payload).unwrap();
      notifySuccess(t('notify.transferAdded'));
      form.resetFields();
      closeModal();
    } catch {
      notifyError(t('notify.transferAddFailed'));
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteTransfer(id).unwrap();
      notifySuccess(t('notify.transferDeleted'));
    } catch {
      notifyError(t('notify.transferDeleteFailed'));
    }
  };

  const activeMembers = (selectedGroup?.members ?? []).filter((m) => m.status === GroupMembershipStatus.ACTIVE);
  const activeMemberIds = new Set(activeMembers.map((m) => m.studentId));
  const groupMemberOptions = activeMembers.map((m) => ({
    value: m.id,
    label: `${m.student?.fullName ?? m.studentId} (${m.student?.phone ?? '-'})`,
  }));
  const availableStudentOptions = (allStudents ?? [])
    .filter((s) => !activeMemberIds.has(s.id))
    .map((s) => ({ value: s.id, label: `${s.fullName} (${s.phone})` }));

  const actionsColumn: ColumnsType<StudentTransfer>[number] = {
    title: t('common.actions'),
    render: (_, record) => (
      <Popconfirm title={t('common.deleteConfirm')} onConfirm={() => handleDelete(record.id)}>
        <Button danger size="small" icon={<DeleteOutlined />} />
      </Popconfirm>
    ),
  };

  const givenTransfers = (transfers ?? []).filter((r) => r.direction === TransferDirection.GIVEN);
  const receivedTransfers = (transfers ?? []).filter((r) => r.direction === TransferDirection.RECEIVED);

  const givenColumns: ColumnsType<StudentTransfer> = [
    { title: t('common.date'), dataIndex: 'date', width: 110 },
    {
      title: t('common.fullName'),
      render: (_, record) => <PersonCell fullName={record.student.fullName} phone={record.student.phone} />,
    },
    { title: t('transfers.groupFrom'), render: (_, record) => record.group.name },
    { title: t('transfers.branchTo'), dataIndex: 'branchName' },
    { title: t('common.comment'), dataIndex: 'note', render: (v) => v ?? '-' },
    actionsColumn,
  ];

  const receivedColumns: ColumnsType<StudentTransfer> = [
    { title: t('common.date'), dataIndex: 'date', width: 110 },
    {
      title: t('common.fullName'),
      render: (_, record) => <PersonCell fullName={record.student.fullName} phone={record.student.phone} />,
    },
    { title: t('transfers.groupTo'), render: (_, record) => record.group.name },
    { title: t('groups.category'), render: (_, record) => <Tag>{record.group.category}</Tag> },
    {
      title: t('billing.totalAmount'),
      render: (_, record) => `${Number(record.group.totalAmount).toLocaleString()} ${t('billing.currency')}`,
    },
    { title: t('groups.startDate'), render: (_, record) => record.group.startDate },
    { title: t('groups.endDate'), render: (_, record) => record.group.endDate ?? '-' },
    { title: t('transfers.branchFrom'), dataIndex: 'branchName' },
    { title: t('common.comment'), dataIndex: 'note', render: (v) => v ?? '-' },
    actionsColumn,
  ];

  const handleExport = async () => {
    await exportToExcel(t('transfers.title'), [
      {
        name: t('transfers.givenSection'),
        columns: [
          { header: t('common.date'), key: 'date', value: (r: StudentTransfer) => r.date },
          { header: t('common.fullName'), key: 'fullName', value: (r: StudentTransfer) => r.student.fullName },
          { header: t('common.phone'), key: 'phone', value: (r: StudentTransfer) => r.student.phone },
          { header: t('transfers.groupFrom'), key: 'group', value: (r: StudentTransfer) => r.group.name },
          { header: t('transfers.branchTo'), key: 'branchName', value: (r: StudentTransfer) => r.branchName },
          { header: t('common.comment'), key: 'note', value: (r: StudentTransfer) => r.note ?? '-' },
        ],
        rows: givenTransfers,
      },
      {
        name: t('transfers.receivedSection'),
        columns: [
          { header: t('common.date'), key: 'date', value: (r: StudentTransfer) => r.date },
          { header: t('common.fullName'), key: 'fullName', value: (r: StudentTransfer) => r.student.fullName },
          { header: t('common.phone'), key: 'phone', value: (r: StudentTransfer) => r.student.phone },
          { header: t('transfers.groupTo'), key: 'group', value: (r: StudentTransfer) => r.group.name },
          { header: t('groups.category'), key: 'category', value: (r: StudentTransfer) => r.group.category },
          {
            header: t('billing.totalAmount'),
            key: 'totalAmount',
            value: (r: StudentTransfer) => Number(r.group.totalAmount),
          },
          { header: t('groups.startDate'), key: 'startDate', value: (r: StudentTransfer) => r.group.startDate },
          { header: t('groups.endDate'), key: 'endDate', value: (r: StudentTransfer) => r.group.endDate ?? '-' },
          { header: t('transfers.branchFrom'), key: 'branchName', value: (r: StudentTransfer) => r.branchName },
          { header: t('common.comment'), key: 'note', value: (r: StudentTransfer) => r.note ?? '-' },
        ],
        rows: receivedTransfers,
      },
    ]);
  };

  return (
    <div>
      <Typography.Title level={4} style={{ marginBottom: 16 }}>
        {t('transfers.title')}
      </Typography.Title>

      <Space style={{ marginBottom: 16 }}>
        <Button icon={<PlusOutlined />} onClick={() => setModalOpen(true)}>
          {t('transfers.addTransfer')}
        </Button>
        <ExportExcelButton onExport={handleExport} disabled={!transfers?.length} />
      </Space>

      <Card
        title={
          <Space>
            <SectionIcon color="#fa8c16" icon={<ExportOutlined />} />
            {t('transfers.givenSection')}
          </Space>
        }
        style={{ marginBottom: 24 }}
      >
        <Table<StudentTransfer>
          rowKey="id"
          dataSource={givenTransfers}
          loading={isLoadingTransfers}
          pagination={false}
          scroll={{ x: true }}
          columns={givenColumns}
        />
      </Card>

      <Card
        title={
          <Space>
            <SectionIcon color="#722ed1" icon={<ImportOutlined />} />
            {t('transfers.receivedSection')}
          </Space>
        }
      >
        <Table<StudentTransfer>
          rowKey="id"
          dataSource={receivedTransfers}
          loading={isLoadingTransfers}
          pagination={false}
          scroll={{ x: true }}
          columns={receivedColumns}
        />
      </Card>

      <Modal
        title={t('transfers.addTransfer')}
        open={modalOpen}
        onCancel={closeModal}
        onOk={() => form.submit()}
        confirmLoading={isCreating}
        okText={t('common.save')}
        cancelText={t('common.cancel')}
        destroyOnClose
      >
        <Form<TransferFormValues>
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{ direction: TransferDirection.GIVEN, mode: 'existing', date: dayjs() }}
        >
          <Form.Item name="direction" label={t('transfers.direction')} rules={[{ required: true }]}>
            <Segmented
              block
              options={[
                { value: TransferDirection.GIVEN, label: t('transfers.directionLabel.given') },
                { value: TransferDirection.RECEIVED, label: t('transfers.directionLabel.received') },
              ]}
              onChange={(value) => {
                setDirection(value as TransferDirection);
                form.setFieldValue('groupStudentId', undefined);
                form.setFieldValue('studentId', undefined);
              }}
            />
          </Form.Item>

          <Form.Item name="groupId" label={t('transfers.selectGroup')} rules={[{ required: true }]}>
            <Select
              showSearch
              optionFilterProp="label"
              options={(myGroups ?? []).map((g) => ({ value: g.id, label: g.name }))}
              onChange={(value) => {
                setSelectedGroupId(value);
                form.setFieldValue('groupStudentId', undefined);
                form.setFieldValue('studentId', undefined);
              }}
            />
          </Form.Item>

          {direction === TransferDirection.GIVEN ? (
            <Form.Item name="groupStudentId" label={t('transfers.selectStudent')} rules={[{ required: true }]}>
              <Select showSearch optionFilterProp="label" options={groupMemberOptions} disabled={!selectedGroupId} />
            </Form.Item>
          ) : (
            <>
              <Form.Item name="mode" label={t('transfers.selectStudent')} rules={[{ required: true }]}>
                <Segmented
                  block
                  options={[
                    { value: 'existing', label: t('groups.existingStudent') },
                    { value: 'new', label: t('groups.newStudent') },
                  ]}
                  onChange={(value) => setMode(value as 'existing' | 'new')}
                />
              </Form.Item>
              {mode === 'existing' ? (
                <Form.Item name="studentId" label={t('common.fullName')} rules={[{ required: true }]}>
                  <Select showSearch optionFilterProp="label" options={availableStudentOptions} disabled={!selectedGroupId} />
                </Form.Item>
              ) : (
                <>
                  <Form.Item name="fullName" label={t('common.fullName')} rules={[{ required: true }]}>
                    <Input placeholder={t('groups.fullNamePlaceholder') ?? ''} />
                  </Form.Item>
                  <Form.Item name="phone" label={t('common.phone')} rules={[{ required: true }]}>
                    <Input placeholder="+998901234567" />
                  </Form.Item>
                  <Form.Item
                    name="password"
                    label={t('groups.password')}
                    rules={[{ required: true, min: 4, message: t('groups.passwordRule') ?? '' }]}
                  >
                    <Input.Password placeholder={t('groups.passwordPlaceholder') ?? ''} />
                  </Form.Item>
                </>
              )}
            </>
          )}

          <Form.Item name="branchName" label={t('transfers.branchName')} rules={[{ required: true }]}>
            <Input placeholder={t('transfers.branchNamePlaceholder') ?? ''} />
          </Form.Item>
          <Form.Item name="date" label={t('common.date')} rules={[{ required: true }]}>
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="note" label={t('common.comment')}>
            <Input.TextArea rows={2} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
