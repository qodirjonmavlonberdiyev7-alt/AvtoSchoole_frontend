import { useMemo, useState, type CSSProperties } from 'react';
import { Alert, Button, Layout, Menu, Grid, Drawer, Tooltip, theme } from 'antd';
import { InstagramOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import { impersonationEnded } from '../../app/auth/authSlice';
import { api } from '../../app/api/baseApi';
import { useNotificationToasts } from '../hooks/useNotificationToasts';
import { SCHOOL_SOCIAL_LINKS } from '../constants/socialLinks';
import { navItems } from './navConfig';
import { AppHeader } from './Header';

const { Sider, Content } = Layout;
const { useBreakpoint } = Grid;

const SOCIAL_BADGE_SIZE = 30;

const socialBadgeStyle = (background: string): CSSProperties => ({
  width: SOCIAL_BADGE_SIZE,
  height: SOCIAL_BADGE_SIZE,
  borderRadius: '50%',
  background,
  color: '#fff',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: 15,
  flexShrink: 0,
});

/**
 * Telegram's own circular paper-plane logomark, reproduced as an inline SVG (the official public
 * brand outline - a single path whose winding creates the paper-plane cutout) instead of a
 * wrapping div + generic "send" arrow icon, so it's instantly recognizable as Telegram.
 */
function TelegramBadge({ size }: { size: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden>
      <defs>
        <linearGradient id="telegram-badge-gradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#2AABEE" />
          <stop offset="100%" stopColor="#229ED9" />
        </linearGradient>
      </defs>
      <path
        fill="url(#telegram-badge-gradient)"
        d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"
      />
    </svg>
  );
}

/**
 * Brand-colored badges rather than plain outline icons - their own background carries the
 * contrast, so they stay legible in both light and dark sidebar themes instead of relying on
 * an inherited text color that goes missing against a dark background.
 */
function SocialLinksFooter() {
  const { t } = useTranslation();
  return (
    <div
      style={{
        display: 'flex',
        gap: 10,
        justifyContent: 'center',
        alignItems: 'center',
        padding: '12px 0',
        borderTop: '1px solid rgba(128, 128, 128, 0.15)',
        flex: '0 0 auto',
      }}
    >
      <Tooltip title={t('social.instagram')}>
        <a
          href={SCHOOL_SOCIAL_LINKS.instagram}
          target="_blank"
          rel="noreferrer"
          style={socialBadgeStyle('radial-gradient(circle at 30% 110%, #fdf497 0%, #fdf497 5%, #fd5949 45%, #d6249f 60%, #285AEB 90%)')}
        >
          <InstagramOutlined />
        </a>
      </Tooltip>
      {SCHOOL_SOCIAL_LINKS.telegram && (
        <Tooltip title={t('social.telegram')}>
          <a
            href={SCHOOL_SOCIAL_LINKS.telegram}
            target="_blank"
            rel="noreferrer"
            style={{ display: 'flex', flexShrink: 0 }}
          >
            <TelegramBadge size={SOCIAL_BADGE_SIZE} />
          </a>
        </Tooltip>
      )}
    </div>
  );
}

function BrandLogo({ collapsed, themeMode }: { collapsed: boolean; themeMode: 'light' | 'dark' }) {
  const { t } = useTranslation();
  return (
    <div
      style={{
        height: 48,
        margin: 12,
        display: 'flex',
        alignItems: 'center',
        justifyContent: collapsed ? 'center' : 'flex-start',
        gap: 8,
        flex: '0 0 auto',
      }}
    >
      <img src="/logo.svg" alt="Xorazm.PravaUz" style={{ width: 32, height: 32, borderRadius: '50%', flexShrink: 0 }} />
      {!collapsed && (
        <strong
          style={{
            color: themeMode === 'dark' ? '#fff' : '#1f1f1f',
            fontSize: 16,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {t('app.title')}
        </strong>
      )}
    </div>
  );
}

export function AppLayout() {
  const { t } = useTranslation();
  const { token } = theme.useToken();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const location = useLocation();
  const user = useAppSelector((state) => state.auth.user);
  const impersonatorSession = useAppSelector((state) => state.auth.impersonatorSession);
  const themeMode = useAppSelector((state) => state.ui.theme);
  const screens = useBreakpoint();
  const isMobile = !screens.md;

  const handleEndImpersonation = () => {
    dispatch(impersonationEnded());
    dispatch(api.util.resetApiState());
    navigate('/admin', { replace: true });
  };

  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const notificationToastHost = useNotificationToasts();

  const visibleItems = useMemo(
    () => navItems.filter((item) => (user ? item.roles.includes(user.role) : false)),
    [user],
  );

  const menuItems = visibleItems.map((item) => ({
    key: item.path,
    icon: <item.icon />,
    label: t(item.labelKey),
  }));

  const selectedKey =
    visibleItems.find((item) => item.path !== '/' && location.pathname.startsWith(item.path))?.path ??
    (location.pathname === '/' ? '/' : undefined);

  const handleNavigate = (path: string) => {
    navigate(path);
    setMobileOpen(false);
  };

  const menu = (
    <Menu
      mode="inline"
      theme={themeMode}
      selectedKeys={selectedKey ? [selectedKey] : []}
      items={menuItems}
      onClick={({ key }) => handleNavigate(key)}
      style={{ borderInlineEnd: 0, background: 'transparent' }}
    />
  );

  return (
    <>
      {/*
        Fixed to the viewport (not content height) so it stays correctly proportioned no matter how
        tall a page's content is, and sits in its own z:0 layer. The whole app shell below gets an
        explicit position+z-index too, so it's compared against this by plain z-index order instead
        of falling into the "positioned vs. non-positioned" stacking bucket, which otherwise lets a
        positioned z:0 layer paint over ordinary (non-positioned) siblings like the header bar.
      */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 0,
          backgroundImage: `url(${themeMode === 'dark' ? '/bg-car-dark.png' : '/bg-car-light.png'})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          filter: 'blur(10px)',
          transform: 'scale(1.05)',
        }}
      />
      <div style={{ position: 'fixed', inset: 0, zIndex: 0, background: token.colorBgLayout, opacity: 0.86 }} />

      <Layout style={{ minHeight: '100vh', position: 'relative', zIndex: 1, background: 'transparent' }}>
        {notificationToastHost}

        {isMobile ? (
          <Drawer
            placement="left"
            open={mobileOpen}
            onClose={() => setMobileOpen(false)}
            styles={{
              // Same trick as the sticky header (see Header.tsx): `background-attachment: fixed`
              // sizes/positions the image relative to the viewport, not this panel's own 240px-wide
              // box, so it lines up pixel-for-pixel with the desktop Sider's transparent backdrop
              // instead of the Drawer's normal opaque surface color.
              content: {
                backgroundImage: `linear-gradient(${token.colorBgLayout}db, ${token.colorBgLayout}db), url(${themeMode === 'dark' ? '/bg-car-dark.png' : '/bg-car-light.png'})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundAttachment: 'fixed',
              },
              header: { background: 'transparent' },
              body: { padding: 0, display: 'flex', flexDirection: 'column', height: '100%', background: 'transparent' },
            }}
            width={240}
            title={
              <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <img src="/logo.svg" alt="Xorazm.PravaUz" style={{ width: 24, height: 24, borderRadius: '50%' }} />
                {t('app.title')}
              </span>
            }
          >
            <div style={{ flex: 1, overflow: 'auto' }}>{menu}</div>
            <SocialLinksFooter />
          </Drawer>
        ) : (
          <Sider
            theme={themeMode}
            collapsible
            collapsed={collapsed}
            onCollapse={setCollapsed}
            trigger={null}
            style={{ position: 'sticky', top: 0, height: '100vh', overflow: 'hidden', background: 'transparent' }}
          >
            <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <BrandLogo collapsed={collapsed} themeMode={themeMode} />
              <div style={{ flex: 1, overflow: 'auto' }}>{menu}</div>
              <SocialLinksFooter />
            </div>
          </Sider>
        )}

        <Layout style={{ background: 'transparent' }}>
          <div style={{ position: 'sticky', top: 0, zIndex: 2 }}>
            <AppHeader
              collapsed={isMobile ? !mobileOpen : collapsed}
              onToggleCollapsed={() => (isMobile ? setMobileOpen((prev) => !prev) : setCollapsed((prev) => !prev))}
              isMobile={isMobile}
            />
            {impersonatorSession && (
              <Alert
                type="warning"
                banner
                showIcon
                message={t('admin.impersonationBanner', { name: user?.fullName })}
                action={
                  <Button size="small" onClick={handleEndImpersonation}>
                    {t('admin.exitImpersonation')}
                  </Button>
                }
              />
            )}
          </div>
          <Content style={{ margin: 16, background: 'transparent' }}>
            <Outlet />
          </Content>
        </Layout>
      </Layout>
    </>
  );
}
