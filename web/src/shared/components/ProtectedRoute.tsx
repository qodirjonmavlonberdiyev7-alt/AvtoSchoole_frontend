import type { PropsWithChildren } from 'react';
import { Navigate } from 'react-router-dom';
import { Result } from 'antd';
import { useTranslation } from 'react-i18next';
import type { Role } from '@avtoschoole/shared';
import { useAppSelector } from '../../app/hooks';

interface ProtectedRouteProps {
  roles?: Role[];
}

export function ProtectedRoute({ roles, children }: PropsWithChildren<ProtectedRouteProps>) {
  const { t } = useTranslation();
  const { accessToken, user } = useAppSelector((state) => state.auth);

  if (!accessToken || !user) {
    return <Navigate to="/login" replace />;
  }

  if (roles && !roles.includes(user.role)) {
    return <Result status="403" title="403" subTitle={t('common.forbidden')} />;
  }

  return <>{children}</>;
}
