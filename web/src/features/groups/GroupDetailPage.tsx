import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Alert,
  Button,
  Card,
  Col,
  DatePicker,
  Divider,
  Empty,
  Form,
  Input,
  InputNumber,
  Modal,
  Popconfirm,
  Row,
  Segmented,
  Select,
  Space,
  Table,
  Tabs,
  Tag,
  Typography,
  theme,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import {
  ArrowLeftOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
  DeleteOutlined,
  EditOutlined,
  FieldTimeOutlined,
  InstagramOutlined,
  PlusOutlined,
  SendOutlined,
  TagsOutlined,
  WalletOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { GroupMembershipStatus, GroupStatus, PaymentMethod, Role } from '@avtoschoole/shared';
import { useAppSelector } from '../../app/hooks';
import {
  useAddStudentToGroupMutation,
  useDeleteGroupMutation,
  useFinishGroupMutation,
  useGetGroupQuery,
  useGetStudentPasswordQuery,
  useListMyStudentsQuery,
  useRemoveStudentFromGroupMutation,
  useResetStudentPasswordMutation,
  useUpdateGroupMutation,
  useUpdateStudentInfoMutation,
} from '../../app/api/groupsApi';
import {
  useGetLedgerQuery,
  useLedgerForGroupQuery,
  useRecordPaymentMutation,
  type LedgerSummary,
} from '../../app/api/billingApi';
import { GroupFinanceStats } from '../../shared/components/GroupFinanceStats';
import { notifyError, notifySuccess } from '../../shared/utils/notify';
import { ExportExcelButton } from '../../shared/components/ExportExcelButton';
import { exportToExcel } from '../../shared/utils/exportExcel';
import { ScheduleManager } from '../schedule/ScheduleManager';

interface AddStudentFormValues {
  mode: 'existing' | 'new';
  studentId?: string;
  fullName?: string;
  phone?: string;
  password?: string;
}

/** A small icon-badge + label/value chip - the same visual language as the finance and stats cards, so a group's key facts read as a glanceable strip instead of a plain label:value list. */
function InfoStat({ icon, color, label, value }: { icon: ReactNode; color: string; label: string; value: ReactNode }) {
  return (
    <Space align="start" size={10}>
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: '50%',
          background: `${color}1f`,
          color,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 16,
          flexShrink: 0,
        }}
      >
        {icon}
      </div>
      <div>
        <Typography.Text type="secondary" style={{ fontSize: 12, display: 'block' }}>
          {label}
        </Typography.Text>
        {value}
      </div>
    </Space>
  );
}

function StudentsTab({ groupId, canManage }: { groupId: string; canManage: boolean }) {
  const { t } = useTranslation();
  const { data: group } = useGetGroupQuery(groupId);
  const { data: allStudents } = useListMyStudentsQuery(undefined, { skip: !canManage });
  const [addStudent, { isLoading: isAdding }] = useAddStudentToGroupMutation();
  const [removeStudent] = useRemoveStudentFromGroupMutation();
  const [resetPassword, { isLoading: isResetting }] = useResetStudentPasswordMutation();
  const [updateStudentInfo, { isLoading: isUpdatingInfo }] = useUpdateStudentInfoMutation();
  const [modalOpen, setModalOpen] = useState(false);
  const [mode, setMode] = useState<'existing' | 'new'>('existing');
  const [credentialStudent, setCredentialStudent] = useState<{ studentId: string; fullName: string; phone: string } | null>(
    null,
  );
  const [editingStudent, setEditingStudent] = useState<{ studentId: string; fullName: string; phone: string } | null>(
    null,
  );
  const [form] = Form.useForm<AddStudentFormValues>();
  const [resetForm] = Form.useForm<{ newPassword: string }>();
  const [editForm] = Form.useForm<{ fullName: string; phone: string }>();
  const { data: currentPassword, isFetching: isLoadingPassword } = useGetStudentPasswordQuery(
    { groupId, studentId: credentialStudent?.studentId ?? '' },
    { skip: !credentialStudent },
  );

  useEffect(() => {
    if (credentialStudent && currentPassword) {
      resetForm.setFieldsValue({ newPassword: currentPassword.password ?? '' });
    }
  }, [credentialStudent, currentPassword, resetForm]);

  const activeMembers = group?.members?.filter((m) => m.status === GroupMembershipStatus.ACTIVE) ?? [];
  const activeMemberIds = new Set(activeMembers.map((m) => m.studentId));
  const availableStudents = (allStudents ?? []).filter((s) => !activeMemberIds.has(s.id));

  const handleAdd = async (values: AddStudentFormValues) => {
    try {
      await addStudent({
        groupId,
        studentId: mode === 'existing' ? values.studentId : undefined,
        fullName: mode === 'new' ? values.fullName : undefined,
        phone: mode === 'new' ? values.phone : undefined,
        password: mode === 'new' ? values.password : undefined,
      }).unwrap();
      notifySuccess(t('notify.studentAdded'));
      setModalOpen(false);
      form.resetFields();
    } catch {
      notifyError(t('notify.studentAddFailed'));
    }
  };

  const handleRemove = async (studentId: string) => {
    try {
      await removeStudent({ groupId, studentId }).unwrap();
      notifySuccess(t('notify.studentRemoved'));
    } catch {
      notifyError(t('notify.studentRemoveFailed'));
    }
  };

  const openCredentials = (m: NonNullable<typeof activeMembers>[number]) => {
    if (!canManage || !m.student) return;
    resetForm.resetFields();
    setCredentialStudent({ studentId: m.studentId, fullName: m.student.fullName, phone: m.student.phone });
  };

  const closeCredentials = () => {
    setCredentialStudent(null);
    resetForm.resetFields();
  };

  const handleResetPassword = async (values: { newPassword: string }) => {
    if (!credentialStudent) return;
    try {
      await resetPassword({ groupId, studentId: credentialStudent.studentId, newPassword: values.newPassword }).unwrap();
      notifySuccess(t('notify.passwordChanged'));
      closeCredentials();
    } catch {
      notifyError(t('notify.passwordResetFailed'));
    }
  };

  const openEditStudent = (m: NonNullable<typeof activeMembers>[number]) => {
    if (!m.student) return;
    editForm.setFieldsValue({ fullName: m.student.fullName, phone: m.student.phone });
    setEditingStudent({ studentId: m.studentId, fullName: m.student.fullName, phone: m.student.phone });
  };

  const closeEditStudent = () => {
    setEditingStudent(null);
    editForm.resetFields();
  };

  const handleEditStudent = async (values: { fullName: string; phone: string }) => {
    if (!editingStudent) return;
    try {
      await updateStudentInfo({ groupId, studentId: editingStudent.studentId, ...values }).unwrap();
      notifySuccess(t('notify.studentInfoUpdated'));
      closeEditStudent();
    } catch {
      notifyError(t('notify.studentInfoUpdateFailed'));
    }
  };

  const columns: ColumnsType<(typeof activeMembers)[number]> = [
    { title: t('common.fullName'), render: (_, m) => m.student?.fullName ?? m.studentId },
    { title: t('common.phone'), render: (_, m) => m.student?.phone ?? '-' },
    { title: t('billing.totalAmount'), dataIndex: 'totalAmount' },
  ];

  if (canManage) {
    columns.push({
      title: t('common.actions'),
      render: (_, m) => (
        <span onClick={(e) => e.stopPropagation()}>
          <Space size="small">
            <Button size="small" icon={<EditOutlined />} onClick={() => openEditStudent(m)} />
            <Popconfirm title={t('groups.removeStudent')} onConfirm={() => handleRemove(m.studentId)}>
              <Button danger size="small">
                {t('common.remove')}
              </Button>
            </Popconfirm>
          </Space>
        </span>
      ),
    });
  }

  const handleExportStudents = async () => {
    await exportToExcel(`${group?.name ?? t('groups.students')}_${t('groups.students')}`, [
      {
        name: t('groups.students'),
        columns: [
          { header: t('common.fullName'), key: 'fullName', value: (m: (typeof activeMembers)[number]) => m.student?.fullName ?? m.studentId },
          { header: t('common.phone'), key: 'phone', value: (m: (typeof activeMembers)[number]) => m.student?.phone ?? '-' },
          { header: t('billing.totalAmount'), key: 'totalAmount', value: (m: (typeof activeMembers)[number]) => Number(m.totalAmount) },
        ],
        rows: activeMembers,
      },
    ]);
  };

  return (
    <div>
      <Space style={{ marginBottom: 16 }}>
        {canManage && (
          <Button icon={<PlusOutlined />} onClick={() => setModalOpen(true)}>
            {t('groups.addStudent')}
          </Button>
        )}
        <ExportExcelButton onExport={handleExportStudents} disabled={!activeMembers.length} />
      </Space>

      <Table
        rowKey="id"
        columns={columns}
        dataSource={activeMembers}
        pagination={false}
        scroll={{ x: true }}
        onRow={(m) => (canManage ? { onClick: () => openCredentials(m), style: { cursor: 'pointer' } } : {})}
      />

      <Modal
        title={t('groups.addStudent')}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={() => form.submit()}
        confirmLoading={isAdding}
        okText={t('common.save')}
        cancelText={t('common.cancel')}
        destroyOnClose
      >
        <Segmented
          style={{ marginBottom: 16 }}
          block
          value={mode}
          onChange={(value) => setMode(value as 'existing' | 'new')}
          options={[
            { value: 'existing', label: t('groups.existingStudent') },
            { value: 'new', label: t('groups.newStudent') },
          ]}
        />
        <Form<AddStudentFormValues> form={form} layout="vertical" onFinish={handleAdd}>
          {mode === 'existing' ? (
            <Form.Item name="studentId" label={t('common.fullName')} rules={[{ required: true }]}>
              <Select
                showSearch
                optionFilterProp="label"
                options={availableStudents.map((s) => ({ value: s.id, label: `${s.fullName} (${s.phone})` }))}
              />
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
        </Form>
      </Modal>

      <Modal
        title={credentialStudent?.fullName}
        open={credentialStudent !== null}
        onCancel={closeCredentials}
        onOk={() => resetForm.submit()}
        confirmLoading={isResetting}
        okText={t('groups.resetPassword')}
        cancelText={t('common.close')}
        destroyOnClose
      >
        {credentialStudent && (
          <Space direction="vertical" style={{ width: '100%' }} size="middle">
            <Typography.Text>
              {t('common.phone')}: <Typography.Text strong>{credentialStudent.phone}</Typography.Text>
            </Typography.Text>

            {!isLoadingPassword && currentPassword && !currentPassword.password && (
              <Alert type="warning" showIcon message={t('groups.passwordNotStoredHint')} />
            )}

            <Form<{ newPassword: string }> form={resetForm} layout="vertical" onFinish={handleResetPassword}>
              <Form.Item
                name="newPassword"
                label={t('groups.password')}
                extra={currentPassword?.password ? t('groups.currentPasswordHint') : undefined}
                rules={[{ required: true, min: 4, message: t('groups.passwordRule') ?? '' }]}
              >
                <Input.Password placeholder={t('groups.passwordPlaceholder') ?? ''} disabled={isLoadingPassword} />
              </Form.Item>
            </Form>
          </Space>
        )}
      </Modal>

      <Modal
        title={t('groups.editStudentTitle')}
        open={editingStudent !== null}
        onCancel={closeEditStudent}
        onOk={() => editForm.submit()}
        confirmLoading={isUpdatingInfo}
        okText={t('common.save')}
        cancelText={t('common.cancel')}
        destroyOnClose
      >
        <Form<{ fullName: string; phone: string }> form={editForm} layout="vertical" onFinish={handleEditStudent}>
          <Form.Item name="fullName" label={t('common.fullName')} rules={[{ required: true }]}>
            <Input placeholder={t('groups.fullNamePlaceholder') ?? ''} />
          </Form.Item>
          <Form.Item name="phone" label={t('common.phone')} rules={[{ required: true }]}>
            <Input placeholder="+998901234567" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

function TransactionHistory({ groupStudentId }: { groupStudentId: string }) {
  const { t } = useTranslation();
  const { token } = theme.useToken();
  const { data: ledger } = useGetLedgerQuery(groupStudentId);

  return (
    <div
      style={{
        margin: '4px 0',
        padding: 16,
        borderRadius: token.borderRadiusLG,
        background: token.colorFillAlter,
        border: `1px solid ${token.colorBorderSecondary}`,
      }}
    >
      <Typography.Text strong style={{ display: 'block', marginBottom: 12 }}>
        {t('billing.history')}
      </Typography.Text>
      {ledger?.transactions?.length ? (
        <Table
          rowKey="id"
          size="small"
          dataSource={ledger.transactions}
          pagination={false}
          columns={[
            { title: t('common.date'), dataIndex: 'paidAt', render: (v: string) => new Date(v).toLocaleString() },
            {
              title: t('common.amount'),
              dataIndex: 'amount',
              render: (v: number) => (
                <Typography.Text strong style={{ color: token.colorSuccess }}>
                  {Number(v).toLocaleString()} {t('billing.currency')}
                </Typography.Text>
              ),
            },
            {
              title: t('billing.method'),
              dataIndex: 'method',
              render: (method: PaymentMethod) => (
                <Tag color={method === PaymentMethod.CASH ? 'gold' : 'blue'}>{t(`billing.methodLabel.${method}`)}</Tag>
              ),
            },
            { title: t('common.comment'), dataIndex: 'note', render: (v) => v ?? '-' },
          ]}
        />
      ) : (
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={t('common.noData')} />
      )}
    </div>
  );
}

function BillingTab({ groupId }: { groupId: string }) {
  const { t } = useTranslation();
  const { data: group } = useGetGroupQuery(groupId);
  const { data: ledgers } = useLedgerForGroupQuery(groupId);
  const [recordPayment, { isLoading: isSaving }] = useRecordPaymentMutation();
  const [modalOpen, setModalOpen] = useState(false);
  const [activeGroupStudentId, setActiveGroupStudentId] = useState<string | null>(null);
  const [form] = Form.useForm<{ amount: number; method: PaymentMethod; note?: string }>();

  // Keyed from every member (not just active ones) - a removed/transferred-out student can still
  // have real payment history that must keep showing their name, not a raw id fallback.
  const memberById = new Map((group?.members ?? []).map((m) => [m.id, m]));

  const openModal = (groupStudentId: string) => {
    setActiveGroupStudentId(groupStudentId);
    setModalOpen(true);
  };

  const handleSubmit = async (values: { amount: number; method: PaymentMethod; note?: string }) => {
    if (!activeGroupStudentId) return;
    try {
      await recordPayment({ groupStudentId: activeGroupStudentId, ...values }).unwrap();
      notifySuccess(t('billing.paymentAccepted'));
      setModalOpen(false);
      form.resetFields();
    } catch {
      notifyError(t('billing.exceedsBalance'));
    }
  };

  const handleExportBilling = async () => {
    await exportToExcel(`${group?.name ?? t('billing.title')}_${t('billing.title')}`, [
      {
        name: t('billing.title'),
        columns: [
          {
            header: t('common.fullName'),
            key: 'fullName',
            value: (l: LedgerSummary) => memberById.get(l.groupStudentId)?.student?.fullName ?? l.studentId,
          },
          { header: t('billing.totalAmount'), key: 'totalAmount', value: (l: LedgerSummary) => Number(l.totalAmount) },
          { header: t('billing.paidAmount'), key: 'paidAmount', value: (l: LedgerSummary) => Number(l.paidAmount) },
          {
            header: t('billing.remainingBalance'),
            key: 'remainingBalance',
            value: (l: LedgerSummary) => Number(l.remainingBalance),
          },
        ],
        rows: ledgers ?? [],
      },
    ]);
  };

  return (
    <div>
      <Space style={{ marginBottom: 16 }}>
        <ExportExcelButton onExport={handleExportBilling} disabled={!ledgers?.length} />
      </Space>
      <Table
        rowKey="groupStudentId"
        dataSource={ledgers}
        pagination={false}
        scroll={{ x: true }}
        expandable={{ expandedRowRender: (l) => <TransactionHistory groupStudentId={l.groupStudentId} /> }}
        columns={[
          {
            title: t('common.fullName'),
            render: (_, l) => {
              const member = memberById.get(l.groupStudentId);
              return (
                <Space>
                  {member?.student?.fullName ?? l.studentId}
                  {member && member.status !== GroupMembershipStatus.ACTIVE && (
                    <Tag>{t('groups.membershipRemoved')}</Tag>
                  )}
                </Space>
              );
            },
          },
          {
            title: t('billing.totalAmount'),
            dataIndex: 'totalAmount',
            render: (v: number) => `${Number(v).toLocaleString()} ${t('billing.currency')}`,
          },
          {
            title: t('billing.paidAmount'),
            dataIndex: 'paidAmount',
            render: (v: number) => `${Number(v).toLocaleString()} ${t('billing.currency')}`,
          },
          {
            title: t('billing.remainingBalance'),
            dataIndex: 'remainingBalance',
            render: (v: number) => (
              <Tag color={v > 0 ? 'red' : 'green'}>
                {Number(v).toLocaleString()} {t('billing.currency')}
              </Tag>
            ),
          },
          {
            title: t('common.actions'),
            render: (_, l) =>
              l.remainingBalance > 0 &&
              l.status === GroupMembershipStatus.ACTIVE && (
                <Button size="small" onClick={() => openModal(l.groupStudentId)}>
                  {t('billing.recordPayment')}
                </Button>
              ),
          },
        ]}
      />

      <Modal
        title={t('billing.recordPayment')}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={() => form.submit()}
        confirmLoading={isSaving}
        okText={t('common.save')}
        cancelText={t('common.cancel')}
        destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit} initialValues={{ method: PaymentMethod.CASH }}>
          <Form.Item name="amount" label={t('common.amount')} rules={[{ required: true }]}>
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="method" label={t('billing.method')} rules={[{ required: true }]}>
            <Segmented
              block
              options={[
                { value: PaymentMethod.CASH, label: t('billing.methodLabel.cash') },
                { value: PaymentMethod.CARD, label: t('billing.methodLabel.card') },
              ]}
            />
          </Form.Item>
          <Form.Item name="note" label={t('common.comment')}>
            <Input.TextArea rows={2} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

interface EditGroupFormValues {
  name: string;
  category: string;
  totalAmount: number;
  startDate: dayjs.Dayjs;
  endDate: dayjs.Dayjs;
  telegramLink?: string;
  instagramLink?: string;
}

export function GroupDetailPage() {
  const { id } = useParams<{ id: string }>();
  const groupId = id as string;
  const { t } = useTranslation();
  const { token } = theme.useToken();
  const navigate = useNavigate();
  const currentUser = useAppSelector((state) => state.auth.user);
  const { data: group } = useGetGroupQuery(groupId);
  const [finishGroup, { isLoading: isFinishing }] = useFinishGroupMutation();
  const [deleteGroup, { isLoading: isDeleting }] = useDeleteGroupMutation();
  const [updateGroup, { isLoading: isUpdating }] = useUpdateGroupMutation();
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editForm] = Form.useForm<EditGroupFormValues>();

  const canManage = currentUser?.role === Role.TEACHER;
  const isStudent = currentUser?.role === Role.STUDENT;

  const handleFinish = async () => {
    try {
      await finishGroup(groupId).unwrap();
      notifySuccess(t('notify.groupFinished'), t('notify.groupFinishedDesc'));
    } catch {
      notifyError(t('notify.groupFinishFailed'));
    }
  };

  const handleDelete = async () => {
    try {
      await deleteGroup(groupId).unwrap();
      notifySuccess(t('notify.groupDeleted'), t('notify.groupDeletedDesc'));
      navigate('/groups');
    } catch {
      notifyError(t('notify.groupDeleteFailed'));
    }
  };

  const openEditModal = () => {
    if (!group) return;
    editForm.setFieldsValue({
      name: group.name,
      category: group.category,
      totalAmount: Number(group.totalAmount),
      startDate: dayjs(group.startDate),
      endDate: group.endDate ? dayjs(group.endDate) : undefined,
      telegramLink: group.telegramLink ?? undefined,
      instagramLink: group.instagramLink ?? undefined,
    });
    setEditModalOpen(true);
  };

  const handleEditSubmit = async (values: EditGroupFormValues) => {
    try {
      await updateGroup({
        id: groupId,
        body: {
          name: values.name,
          category: values.category,
          totalAmount: values.totalAmount,
          startDate: values.startDate.format('YYYY-MM-DD'),
          endDate: values.endDate.format('YYYY-MM-DD'),
          telegramLink: values.telegramLink || undefined,
          instagramLink: values.instagramLink || undefined,
        },
      }).unwrap();
      notifySuccess(t('notify.groupUpdated'));
      setEditModalOpen(false);
    } catch {
      notifyError(t('notify.groupUpdateFailed'));
    }
  };

  const items = useMemo(() => {
    if (isStudent) {
      return [{ key: 'schedule', label: t('schedule.title'), children: <ScheduleManager canManage={false} /> }];
    }
    const tabs = [
      { key: 'students', label: t('groups.students'), children: <StudentsTab groupId={groupId} canManage={canManage} /> },
      { key: 'schedule', label: t('schedule.title'), children: <ScheduleManager canManage={canManage} /> },
    ];
    if (canManage) {
      tabs.push({ key: 'billing', label: t('billing.title'), children: <BillingTab groupId={groupId} /> });
    }
    return tabs;
  }, [groupId, canManage, isStudent, t]);

  if (!canManage && !isStudent) {
    return null;
  }

  return (
    <div>
      <Space style={{ marginBottom: 16, width: '100%', justifyContent: 'space-between' }} wrap>
        <Space align="center">
          <Button
            type="text"
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate('/groups')}
            aria-label={t('common.back')}
          />
          <Typography.Title level={4} style={{ margin: 0 }}>
            {group?.name}
          </Typography.Title>
        </Space>
        {canManage && (
          <Space wrap>
            <Button icon={<EditOutlined />} onClick={openEditModal}>
              {t('common.edit')}
            </Button>
            {group?.status === GroupStatus.ACTIVE && (
              <Popconfirm title={t('groups.finishConfirm')} onConfirm={handleFinish}>
                <Button icon={<CheckCircleOutlined />} loading={isFinishing}>
                  {t('groups.finish')}
                </Button>
              </Popconfirm>
            )}
            <Popconfirm title={t('groups.deleteConfirm')} onConfirm={handleDelete}>
              <Button danger icon={<DeleteOutlined />} loading={isDeleting}>
                {t('common.delete')}
              </Button>
            </Popconfirm>
          </Space>
        )}
      </Space>

      <Card style={{ marginBottom: 16 }}>
        <Row gutter={[24, 20]}>
          <Col xs={12} sm={8} md={4}>
            <InfoStat
              icon={<TagsOutlined />}
              color={token.colorPrimary}
              label={t('groups.category')}
              value={<Tag>{group?.category}</Tag>}
            />
          </Col>
          <Col xs={12} sm={8} md={5}>
            <InfoStat
              icon={<WalletOutlined />}
              color="#52c41a"
              label={t('billing.totalAmount')}
              value={
                <Typography.Text strong>
                  {Number(group?.totalAmount ?? 0).toLocaleString()} {t('billing.currency')}
                </Typography.Text>
              }
            />
          </Col>
          <Col xs={12} sm={8} md={5}>
            <InfoStat
              icon={<CalendarOutlined />}
              color="#1677ff"
              label={t('groups.startDate')}
              value={<Typography.Text strong>{group?.startDate}</Typography.Text>}
            />
          </Col>
          <Col xs={12} sm={8} md={5}>
            <InfoStat
              icon={<FieldTimeOutlined />}
              color="#fa8c16"
              label={t('groups.endDate')}
              value={<Typography.Text strong>{group?.endDate ?? '-'}</Typography.Text>}
            />
          </Col>
          <Col xs={12} sm={8} md={5}>
            <InfoStat
              icon={<CheckCircleOutlined />}
              color={group?.status === GroupStatus.ACTIVE ? '#52c41a' : '#8c8c8c'}
              label={t('common.status')}
              value={
                group && (
                  <Tag color={group.status === GroupStatus.ACTIVE ? 'green' : 'default'}>
                    {t(`groups.status.${group.status}`)}
                  </Tag>
                )
              }
            />
          </Col>
        </Row>

        {(group?.telegramLink || group?.instagramLink) && (
          <>
            <Divider style={{ margin: '20px 0 16px' }} />
            <Space size={20} wrap>
              {group?.telegramLink && (
                <a href={group.telegramLink} target="_blank" rel="noreferrer">
                  <SendOutlined /> {group.telegramLink}
                </a>
              )}
              {group?.instagramLink && (
                <a href={group.instagramLink} target="_blank" rel="noreferrer">
                  <InstagramOutlined /> {group.instagramLink}
                </a>
              )}
            </Space>
          </>
        )}
      </Card>

      <Tabs items={items} />

      {canManage && (
        <Card title={t('dashboard.groupFinance')} style={{ marginTop: 16 }}>
          <GroupFinanceStats groupId={groupId} />
        </Card>
      )}

      <Modal
        title={t('groups.editTitle')}
        open={editModalOpen}
        onCancel={() => setEditModalOpen(false)}
        onOk={() => editForm.submit()}
        confirmLoading={isUpdating}
        okText={t('common.save')}
        cancelText={t('common.cancel')}
        destroyOnClose
      >
        <Form<EditGroupFormValues> form={editForm} layout="vertical" onFinish={handleEditSubmit}>
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
