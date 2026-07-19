import { Avatar, Dropdown, Layout, Space, Switch, theme, Typography } from 'antd';
import type { MenuProps } from 'antd';
import {
  BulbOutlined,
  GlobalOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  MoonOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import { themeToggled } from '../../app/uiSlice';
import { loggedOut } from '../../app/auth/authSlice';
import { api } from '../../app/api/baseApi';
import { useLogoutMutation } from '../../app/api/authApi';
import { getAvatarUrl } from '../../app/api/profileApi';
import { NotificationsBell } from '../components/NotificationsBell';

const { Header: AntHeader } = Layout;

const LANGUAGES = [
  { code: 'uz', label: "O'zbekcha" },
  { code: 'ru', label: 'Русский' },
  { code: 'en', label: 'English' },
];

interface AppHeaderProps {
  collapsed: boolean;
  onToggleCollapsed: () => void;
  isMobile: boolean;
}

export function AppHeader({ collapsed, onToggleCollapsed, isMobile }: AppHeaderProps) {
  const { t, i18n } = useTranslation();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const user = useAppSelector((state) => state.auth.user);
  const themeMode = useAppSelector((state) => state.ui.theme);
  const [logout] = useLogoutMutation();
  const { token } = theme.useToken();

  const handleLogout = async () => {
    try {
      await logout().unwrap();
    } catch {
      // ignore network errors on logout; we clear local session regardless
    }
    dispatch(loggedOut());
    dispatch(api.util.resetApiState());
    navigate('/login', { replace: true });
  };

  const languageMenuItems: MenuProps['items'] = LANGUAGES.map((lang) => ({
    key: lang.code,
    label: lang.label,
  }));

  const userMenuItems: MenuProps['items'] = [
    {
      key: 'role',
      label: user ? t(`roles.${user.role}`) : '',
      disabled: true,
    },
    { type: 'divider' },
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: t('nav.profile'),
      onClick: () => navigate('/profile'),
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: t('nav.logout'),
      onClick: handleLogout,
    },
  ];

  return (
    <AntHeader
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        // A sticky header always has scrolled page content passing directly behind it, so plain
        // transparency reveals that content instead of the shared backdrop. `background-attachment:
        // fixed` sizes/positions the image relative to the viewport (not this element's own small
        // box), so it lines up pixel-for-pixel with the page-wide backdrop while still being
        // painted (and clipped) within the header's own box - unlike a nested `position: fixed` div,
        // a background image never escapes its element's bounds.
        backgroundImage: `linear-gradient(${token.colorBgLayout}db, ${token.colorBgLayout}db), url(${themeMode === 'dark' ? '/bg-car-dark.png' : '/bg-car-light.png'})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
        boxShadow: `0 1px 2px ${token.colorBorderSecondary}`,
      }}
    >
      <Space>
        <span
          onClick={onToggleCollapsed}
          style={{
            fontSize: 16,
            cursor: 'pointer',
            width: 32,
            height: 32,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: token.borderRadius,
          }}
        >
          {collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
        </span>
        {isMobile && <Typography.Text strong>{t('app.title')}</Typography.Text>}
      </Space>

      <Space size="middle">
        <NotificationsBell />

        <Switch
          checked={themeMode === 'dark'}
          onChange={() => dispatch(themeToggled())}
          checkedChildren={<MoonOutlined />}
          unCheckedChildren={<BulbOutlined />}
        />

        <Dropdown
          menu={{
            items: languageMenuItems,
            selectedKeys: [i18n.language],
            onClick: ({ key }) => i18n.changeLanguage(key),
          }}
          trigger={['click']}
        >
          <Space style={{ cursor: 'pointer' }}>
            <GlobalOutlined />
            {!isMobile && LANGUAGES.find((l) => l.code === i18n.language)?.label}
          </Space>
        </Dropdown>

        <Dropdown menu={{ items: userMenuItems }} trigger={['click']}>
          <Space style={{ cursor: 'pointer' }}>
            <Avatar
              src={user?.avatarFilename ? getAvatarUrl(user.avatarFilename) : undefined}
              icon={!user?.avatarFilename ? <UserOutlined /> : undefined}
            />
            {!isMobile && <Typography.Text>{user?.fullName}</Typography.Text>}
          </Space>
        </Dropdown>
      </Space>
    </AntHeader>
  );
}
