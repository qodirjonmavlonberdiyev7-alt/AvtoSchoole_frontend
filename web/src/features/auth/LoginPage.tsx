import { useState } from 'react';
import { Alert, Button, Card, Form, Input, Space, Typography, theme } from 'antd';
import { LockOutlined, PhoneOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Role } from '@avtoschoole/shared';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import { credentialsSet } from '../../app/auth/authSlice';
import { useLoginMutation } from '../../app/api/authApi';
import { api } from '../../app/api/baseApi';

interface LoginFormValues {
  phone: string;
  password: string;
}

export function LoginPage() {
  const { t } = useTranslation();
  const { token } = theme.useToken();
  const themeMode = useAppSelector((state) => state.ui.theme);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [login, { isLoading }] = useLoginMutation();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (values: LoginFormValues) => {
    setErrorMessage(null);
    try {
      const result = await login(values).unwrap();
      // Without this, logging in as a new user right after another account's session (no
      // intervening full page reload) would keep serving that previous account's cached
      // queries - notifications, groups, stats, anything RTK Query had cached - since none of
      // those cache keys are scoped by user id, only by endpoint+args.
      dispatch(api.util.resetApiState());
      dispatch(credentialsSet(result));
      navigate(result.user.role === Role.SUPERADMIN ? '/admin' : '/', { replace: true });
    } catch (error) {
      const message =
        error && typeof error === 'object' && 'data' in error
          ? ((error as { data?: { message?: string } }).data?.message ?? t('auth.loginError'))
          : t('auth.loginError');
      setErrorMessage(Array.isArray(message) ? message.join(', ') : message);
    }
  };

  return (
    <div style={{ position: 'relative', minHeight: '100vh', overflow: 'hidden' }}>
      <div
        style={{
          position: 'absolute',
          inset: -12,
          backgroundImage: `url(${themeMode === 'dark' ? '/bg-car-dark.png' : '/bg-car-light.png'})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          filter: 'blur(10px)',
        }}
      />
      <div style={{ position: 'absolute', inset: 0, background: token.colorBgLayout, opacity: 0.86 }} />

      <div
        style={{
          position: 'relative',
          zIndex: 1,
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 16,
        }}
      >
        <Card style={{ width: 380, maxWidth: '100%', boxShadow: token.boxShadowSecondary }}>
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <div style={{ textAlign: 'center' }}>
              <img
                src="/logo.svg"
                alt="Xorazm.PravaUz"
                style={{ width: 64, height: 64, borderRadius: '50%', marginBottom: 12 }}
              />
              <Typography.Title level={3} style={{ marginBottom: 0 }}>
                {t('app.title')}
              </Typography.Title>
              <Typography.Text type="secondary">{t('auth.loginSubtitle')}</Typography.Text>
            </div>

            {errorMessage && <Alert type="error" message={errorMessage} showIcon />}

            <Form<LoginFormValues> layout="vertical" onFinish={handleSubmit} requiredMark={false}>
              <Form.Item name="phone" label={t('auth.phone')} rules={[{ required: true }]}>
                <Input prefix={<PhoneOutlined />} placeholder="+998901234567" size="large" autoComplete="username" />
              </Form.Item>
              <Form.Item name="password" label={t('auth.password')} rules={[{ required: true }]}>
                <Input.Password prefix={<LockOutlined />} size="large" autoComplete="current-password" />
              </Form.Item>
              <Form.Item style={{ marginBottom: 0 }}>
                <Button type="primary" htmlType="submit" block size="large" loading={isLoading}>
                  {t('auth.login')}
                </Button>
              </Form.Item>
            </Form>
          </Space>
        </Card>
      </div>
    </div>
  );
}
