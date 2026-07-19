import { useEffect, useState } from 'react';
import { Alert, Button, Card, Col, Form, Input, Modal, Popconfirm, Row, Space, Statistic, Switch, Table, Tag, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { EditOutlined, PlusOutlined, TeamOutlined, UserAddOutlined, UsergroupAddOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import type { UserDto } from '@avtoschoole/shared';
import {
  useAdminStatsQuery,
  useCreateTeacherMutation,
  useGetTeacherPasswordQuery,
  useImpersonateTeacherMutation,
  useListTeachersQuery,
  useSetTeacherActiveMutation,
  useSetTeacherPasswordMutation,
} from '../../app/api/adminApi';
import { api } from '../../app/api/baseApi';
import { useAppDispatch } from '../../app/hooks';
import { impersonationStarted } from '../../app/auth/authSlice';
import { MetricBarChart } from '../../shared/components/MetricBarChart';
import { notifyError, notifySuccess } from '../../shared/utils/notify';
import { ExportExcelButton } from '../../shared/components/ExportExcelButton';
import { exportToExcel } from '../../shared/utils/exportExcel';

interface CreateTeacherFormValues {
  fullName: string;
  phone: string;
  password: string;
}

export function SuperAdminDashboardPage() {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const { data: stats } = useAdminStatsQuery();
  const { data: teachers, isLoading } = useListTeachersQuery();
  const [createTeacher, { isLoading: isCreating }] = useCreateTeacherMutation();
  const [setTeacherActive] = useSetTeacherActiveMutation();
  const [setTeacherPassword, { isLoading: isSettingPassword }] = useSetTeacherPasswordMutation();
  const [impersonateTeacher, { isLoading: isImpersonating }] = useImpersonateTeacherMutation();

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createForm] = Form.useForm<CreateTeacherFormValues>();

  const [credentialTeacher, setCredentialTeacher] = useState<UserDto | null>(null);
  const [passwordForm] = Form.useForm<{ newPassword: string }>();
  const { data: currentPassword, isFetching: isLoadingPassword } = useGetTeacherPasswordQuery(
    credentialTeacher?.id ?? '',
    { skip: !credentialTeacher },
  );

  useEffect(() => {
    if (credentialTeacher && currentPassword) {
      passwordForm.setFieldsValue({ newPassword: currentPassword.password ?? '' });
    }
  }, [credentialTeacher, currentPassword, passwordForm]);

  const openCreateModal = () => {
    createForm.resetFields();
    setCreateModalOpen(true);
  };

  const handleCreateSubmit = async (values: CreateTeacherFormValues) => {
    try {
      await createTeacher(values).unwrap();
      notifySuccess(t('notify.teacherAdded'));
      setCreateModalOpen(false);
      createForm.resetFields();
    } catch {
      notifyError(t('notify.teacherAddFailed'));
    }
  };

  const openCredentials = (teacher: UserDto) => {
    passwordForm.resetFields();
    setCredentialTeacher(teacher);
  };

  const closeCredentials = () => {
    setCredentialTeacher(null);
    passwordForm.resetFields();
  };

  const handlePasswordSubmit = async (values: { newPassword: string }) => {
    if (!credentialTeacher) return;
    try {
      await setTeacherPassword({ teacherId: credentialTeacher.id, newPassword: values.newPassword }).unwrap();
      notifySuccess(t('notify.passwordChanged'));
      closeCredentials();
    } catch {
      notifyError(t('notify.passwordResetFailed'));
    }
  };

  const handleToggleActive = async (teacher: UserDto) => {
    try {
      await setTeacherActive({ teacherId: teacher.id, isActive: !teacher.isActive }).unwrap();
      notifySuccess(teacher.isActive ? t('notify.teacherDeactivated') : t('notify.teacherActivated'));
    } catch {
      notifyError(t('notify.teacherStatusChangeFailed'));
    }
  };

  const handleImpersonate = async (teacher: UserDto) => {
    try {
      const result = await impersonateTeacher(teacher.id).unwrap();
      dispatch(impersonationStarted(result));
      dispatch(api.util.resetApiState());
      navigate('/');
    } catch {
      notifyError(t('notify.impersonateFailed'));
    }
  };

  const handleExport = async () => {
    await exportToExcel(t('admin.title'), [
      {
        name: t('admin.title'),
        columns: [
          { header: t('common.fullName'), key: 'fullName', value: (u: UserDto) => u.fullName },
          { header: t('common.phone'), key: 'phone', value: (u: UserDto) => u.phone },
          {
            header: t('common.status'),
            key: 'status',
            value: (u: UserDto) => (u.isActive ? t('common.active') : t('admin.inactive')),
          },
          {
            header: t('admin.registeredAt'),
            key: 'createdAt',
            value: (u: UserDto) => new Date(u.createdAt).toLocaleDateString(),
          },
        ],
        rows: teachers ?? [],
      },
    ]);
  };

  const columns: ColumnsType<UserDto> = [
    { title: t('common.fullName'), dataIndex: 'fullName' },
    { title: t('common.phone'), dataIndex: 'phone' },
    {
      title: t('common.status'),
      dataIndex: 'isActive',
      render: (isActive: boolean) => (
        <Tag color={isActive ? 'green' : 'default'}>{isActive ? t('common.active') : t('admin.inactive')}</Tag>
      ),
    },
    {
      title: t('admin.registeredAt'),
      dataIndex: 'createdAt',
      render: (v: string) => new Date(v).toLocaleDateString(),
    },
    {
      title: t('common.actions'),
      render: (_, teacher) => (
        <Space wrap>
          <Button size="small" icon={<EditOutlined />} onClick={() => openCredentials(teacher)}>
            {t('admin.password')}
          </Button>
          <Popconfirm
            title={teacher.isActive ? t('admin.deactivateConfirm') : t('admin.activateConfirm')}
            onConfirm={() => handleToggleActive(teacher)}
          >
            <Switch checked={teacher.isActive} size="small" />
          </Popconfirm>
          <Button size="small" type="primary" loading={isImpersonating} onClick={() => handleImpersonate(teacher)}>
            {t('admin.manage')}
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Space style={{ marginBottom: 16, width: '100%', justifyContent: 'space-between' }}>
        <Typography.Title level={4} style={{ margin: 0 }}>
          {t('admin.title')}
        </Typography.Title>
        <Space>
          <ExportExcelButton onExport={handleExport} disabled={!teachers?.length} />
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreateModal}>
            {t('admin.addTeacher')}
          </Button>
        </Space>
      </Space>

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={12}>
          <Card>
            <Statistic title={t('admin.totalTeachers')} value={stats?.totalTeachers ?? 0} prefix={<TeamOutlined />} />
          </Card>
        </Col>
        <Col xs={24} sm={12}>
          <Card>
            <Statistic
              title={t('admin.totalStudents')}
              value={stats?.totalStudents ?? 0}
              prefix={<UsergroupAddOutlined />}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12}>
          <MetricBarChart
            title={t('admin.newTeachers')}
            values={stats?.newTeachers}
            color="#1677ff"
            icon={<UserAddOutlined />}
          />
        </Col>
        <Col xs={24} sm={12}>
          <MetricBarChart
            title={t('admin.newStudents')}
            values={stats?.newStudents}
            color="#722ed1"
            icon={<UsergroupAddOutlined />}
          />
        </Col>
      </Row>

      <Table<UserDto>
        rowKey="id"
        columns={columns}
        dataSource={teachers}
        loading={isLoading}
        pagination={false}
        scroll={{ x: true }}
      />

      <Modal
        title={t('admin.addTeacher')}
        open={createModalOpen}
        onCancel={() => setCreateModalOpen(false)}
        onOk={() => createForm.submit()}
        confirmLoading={isCreating}
        okText={t('common.save')}
        cancelText={t('common.cancel')}
        destroyOnClose
      >
        <Form<CreateTeacherFormValues> form={createForm} layout="vertical" onFinish={handleCreateSubmit}>
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
        </Form>
      </Modal>

      <Modal
        title={credentialTeacher?.fullName}
        open={credentialTeacher !== null}
        onCancel={closeCredentials}
        onOk={() => passwordForm.submit()}
        confirmLoading={isSettingPassword}
        okText={t('groups.resetPassword')}
        cancelText={t('common.close')}
        destroyOnClose
      >
        {credentialTeacher && (
          <Space direction="vertical" style={{ width: '100%' }} size="middle">
            <Typography.Text>
              {t('common.phone')}: <Typography.Text strong>{credentialTeacher.phone}</Typography.Text>
            </Typography.Text>

            {!isLoadingPassword && currentPassword && !currentPassword.password && (
              <Alert type="warning" showIcon message={t('groups.passwordNotStoredHint')} />
            )}

            <Form<{ newPassword: string }> form={passwordForm} layout="vertical" onFinish={handlePasswordSubmit}>
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
    </div>
  );
}
