import { Role } from '@avtoschoole/shared';
import {
  BarChartOutlined,
  CameraOutlined,
  CreditCardOutlined,
  CrownOutlined,
  FileTextOutlined,
  HomeOutlined,
  SafetyCertificateOutlined,
  ScheduleOutlined,
  SwapOutlined,
  TeamOutlined,
  WalletOutlined,
} from '@ant-design/icons';
import type { ComponentType } from 'react';

export interface NavItem {
  key: string;
  path: string;
  labelKey: string;
  icon: ComponentType;
  roles: Role[];
}

export const navItems: NavItem[] = [
  {
    key: 'admin',
    path: '/admin',
    labelKey: 'nav.admin',
    icon: CrownOutlined,
    roles: [Role.SUPERADMIN],
  },
  {
    key: 'dashboard',
    path: '/',
    labelKey: 'nav.dashboard',
    icon: HomeOutlined,
    roles: [Role.TEACHER, Role.STUDENT],
  },
  {
    key: 'groups',
    path: '/groups',
    labelKey: 'nav.groups',
    icon: TeamOutlined,
    roles: [Role.TEACHER],
  },
  {
    key: 'my-schedule',
    path: '/my-schedule',
    labelKey: 'nav.schedule',
    icon: ScheduleOutlined,
    roles: [Role.TEACHER, Role.STUDENT],
  },
  {
    key: 'my-billing',
    path: '/my-billing',
    labelKey: 'nav.billing',
    icon: CreditCardOutlined,
    roles: [Role.STUDENT],
  },
  {
    key: 'insurance',
    path: '/insurance',
    labelKey: 'nav.insurance',
    icon: SafetyCertificateOutlined,
    roles: [Role.TEACHER],
  },
  {
    key: 'stats',
    path: '/stats',
    labelKey: 'nav.stats',
    icon: BarChartOutlined,
    roles: [Role.TEACHER],
  },
  {
    key: 'transfers',
    path: '/transfers',
    labelKey: 'nav.transfers',
    icon: SwapOutlined,
    roles: [Role.TEACHER],
  },
  {
    key: 'cashflow',
    path: '/cashflow',
    labelKey: 'nav.cashflow',
    icon: WalletOutlined,
    roles: [Role.TEACHER],
  },
  {
    key: 'reports',
    path: '/reports',
    labelKey: 'nav.reports',
    icon: CameraOutlined,
    roles: [Role.TEACHER],
  },
  {
    key: 'notes',
    path: '/notes',
    labelKey: 'nav.notes',
    icon: FileTextOutlined,
    roles: [Role.TEACHER],
  },
];
