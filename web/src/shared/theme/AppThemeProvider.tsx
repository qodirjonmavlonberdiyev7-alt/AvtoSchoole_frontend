import { useEffect, useMemo, type PropsWithChildren } from 'react';
import { ConfigProvider, theme as antdTheme } from 'antd';
import ruRU from 'antd/locale/ru_RU';
import enUS from 'antd/locale/en_US';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';
import 'dayjs/locale/uz-latn';
import 'dayjs/locale/ru';
import { useAppSelector } from '../../app/hooks';
import uzUZ from './uz_UZ';

const antdLocaleByLanguage: Record<string, typeof enUS> = {
  ru: ruRU,
  en: enUS,
  uz: uzUZ,
};

// AntD's `locale` prop above only translates AntD's OWN UI strings (buttons, placeholders) -
// the DatePicker/Calendar's actual month/day NAMES come from dayjs's separate locale data, so
// it has to be switched here too, or a DatePicker always shows English month names regardless
// of the app's selected language. Latin script ("Yanvar"), not dayjs's default Cyrillic "uz".
const dayjsLocaleByLanguage: Record<string, string> = {
  ru: 'ru',
  en: 'en',
  uz: 'uz-latn',
};

// Set once at module load (app defaults to "uz") so the very first render doesn't briefly
// flash English month names before the effect below syncs it to the actual selected language.
dayjs.locale('uz-latn');

const BRAND_COLOR = '#2f6fed';

/**
 * `html`/`body`/`#root` have no background of their own, so whenever the page's scrollable
 * height slightly exceeds the themed Layout's box (e.g. a short page, or an overscroll bounce),
 * the browser's raw white canvas shows through underneath. Sync the real page background to
 * AntD's own resolved `colorBgLayout` token so that gap always matches the current theme.
 */
function BodyBackgroundSync({ mode }: { mode: 'light' | 'dark' }) {
  const { token } = antdTheme.useToken();

  useEffect(() => {
    document.documentElement.style.backgroundColor = token.colorBgLayout;
    document.body.style.backgroundColor = token.colorBgLayout;
    document.documentElement.dataset.theme = mode;
  }, [token.colorBgLayout, mode]);

  return null;
}

export function AppThemeProvider({ children }: PropsWithChildren) {
  const mode = useAppSelector((state) => state.ui.theme);
  const { i18n } = useTranslation();

  const locale = antdLocaleByLanguage[i18n.language] ?? uzUZ;

  useEffect(() => {
    dayjs.locale(dayjsLocaleByLanguage[i18n.language] ?? 'uz-latn');
  }, [i18n.language]);

  const themeConfig = useMemo(
    () => ({
      algorithm: mode === 'dark' ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
      token: {
        colorPrimary: BRAND_COLOR,
        borderRadius: 8,
        borderRadiusLG: 12,
      },
      components: {
        Menu: {
          itemBorderRadius: 8,
          itemMarginInline: 12,
          itemMarginBlock: 4,
          itemHeight: 42,
        },
        Card: {
          borderRadiusLG: 12,
        },
        Layout: {
          headerPadding: '0 20px',
        },
      },
    }),
    [mode],
  );

  return (
    <ConfigProvider theme={themeConfig} locale={locale}>
      <BodyBackgroundSync mode={mode} />
      {children}
    </ConfigProvider>
  );
}
