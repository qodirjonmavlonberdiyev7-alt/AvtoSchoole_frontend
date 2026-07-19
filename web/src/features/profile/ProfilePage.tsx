import { useEffect, useRef, type ChangeEvent } from 'react';
import { Alert, Avatar, Button, Card, Form, Input, Space, Typography } from 'antd';
import { CameraOutlined, LockOutlined, UserOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import {
  getAvatarUrl,
  useChangePasswordMutation,
  useGetCurrentPasswordQuery,
  useUpdateProfileMutation,
  useUploadAvatarMutation,
} from '../../app/api/profileApi';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import { userUpdated } from '../../app/auth/authSlice';
import { notifyError, notifySuccess } from '../../shared/utils/notify';

interface ProfileFormValues {
  fullName: string;
  phone: string;
}

interface PasswordFormValues {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export function ProfilePage() {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [updateProfile, { isLoading: isSavingProfile }] = useUpdateProfileMutation();
  const [changePassword, { isLoading: isSavingPassword }] = useChangePasswordMutation();
  const [uploadAvatar, { isLoading: isUploadingAvatar }] = useUploadAvatarMutation();
  const { data: currentPasswordData, isFetching: isLoadingPassword } = useGetCurrentPasswordQuery();

  const [profileForm] = Form.useForm<ProfileFormValues>();
  const [passwordForm] = Form.useForm<PasswordFormValues>();

  useEffect(() => {
    if (currentPasswordData) {
      passwordForm.setFieldValue('currentPassword', currentPasswordData.password ?? '');
    }
  }, [currentPasswordData, passwordForm]);

  const handleAvatarClick = () => fileInputRef.current?.click();

  const handleAvatarChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    const body = new FormData();
    body.append('avatar', file);
    try {
      const result = await uploadAvatar(body).unwrap();
      dispatch(userUpdated(result));
      notifySuccess(t('notify.avatarUpdated'));
    } catch {
      notifyError(t('notify.avatarUpdateFailed'));
    }
  };

  const handleProfileSubmit = async (values: ProfileFormValues) => {
    try {
      const result = await updateProfile(values).unwrap();
      dispatch(userUpdated(result));
      notifySuccess(t('notify.profileUpdated'));
    } catch {
      notifyError(t('notify.profileUpdateFailed'));
    }
  };

  const handlePasswordSubmit = async (values: PasswordFormValues) => {
    try {
      await changePassword({ currentPassword: values.currentPassword, newPassword: values.newPassword }).unwrap();
      notifySuccess(t('notify.passwordChanged'));
      passwordForm.resetFields();
      // Reflect the just-set password immediately, without waiting on a fresh network round-trip.
      passwordForm.setFieldValue('currentPassword', values.newPassword);
    } catch {
      notifyError(t('notify.passwordResetFailed'));
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div>
      <Typography.Title level={4}>{t('profile.title')}</Typography.Title>

      <Card style={{ marginBottom: 16, maxWidth: 480 }}>
        <Space direction="vertical" align="center" style={{ width: '100%' }}>
          <div style={{ position: 'relative', width: 96, height: 96 }}>
            <Avatar
              size={96}
              src={user.avatarFilename ? getAvatarUrl(user.avatarFilename) : undefined}
              icon={!user.avatarFilename ? <UserOutlined /> : undefined}
            />
            <Button
              shape="circle"
              size="small"
              icon={<CameraOutlined />}
              loading={isUploadingAvatar}
              onClick={handleAvatarClick}
              style={{ position: 'absolute', bottom: 0, right: 0 }}
            />
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleAvatarChange}
            />
          </div>
          <Typography.Text strong style={{ fontSize: 16 }}>
            {user.fullName}
          </Typography.Text>
          <Typography.Text type="secondary">{t(`roles.${user.role}`)}</Typography.Text>
        </Space>
      </Card>

      <Card title={t('profile.personalInfo')} style={{ marginBottom: 16, maxWidth: 480 }}>
        <Form<ProfileFormValues>
          form={profileForm}
          layout="vertical"
          initialValues={{ fullName: user.fullName, phone: user.phone }}
          onFinish={handleProfileSubmit}
        >
          <Form.Item name="fullName" label={t('common.fullName')} rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="phone" label={t('common.phone')} rules={[{ required: true }]}>
            <Input placeholder="+998901234567" />
          </Form.Item>
          <Button type="primary" htmlType="submit" loading={isSavingProfile}>
            {t('common.save')}
          </Button>
        </Form>
      </Card>

      <Card title={t('profile.changePassword')} style={{ maxWidth: 480 }}>
        {!isLoadingPassword && currentPasswordData && !currentPasswordData.password && (
          <Alert
            type="warning"
            showIcon
            style={{ marginBottom: 16 }}
            message={t('profile.passwordNotStoredHint')}
          />
        )}
        <Form<PasswordFormValues> form={passwordForm} layout="vertical" onFinish={handlePasswordSubmit}>
          <Form.Item
            name="currentPassword"
            label={t('profile.currentPassword')}
            extra={currentPasswordData?.password ? t('profile.currentPasswordHint') : undefined}
            rules={[{ required: true }]}
          >
            <Input.Password prefix={<LockOutlined />} disabled={isLoadingPassword} />
          </Form.Item>
          <Form.Item
            name="newPassword"
            label={t('groups.password')}
            rules={[{ required: true, min: 4, message: t('groups.passwordRule') ?? '' }]}
          >
            <Input.Password prefix={<LockOutlined />} />
          </Form.Item>
          <Form.Item
            name="confirmPassword"
            label={t('profile.confirmPassword')}
            dependencies={['newPassword']}
            rules={[
              { required: true },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('newPassword') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error(t('profile.passwordMismatch') ?? ''));
                },
              }),
            ]}
          >
            <Input.Password prefix={<LockOutlined />} />
          </Form.Item>
          <Button type="primary" htmlType="submit" loading={isSavingPassword}>
            {t('common.save')}
          </Button>
        </Form>
      </Card>
    </div>
  );
}
