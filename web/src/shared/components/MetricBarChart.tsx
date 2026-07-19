import type { ReactNode } from 'react';
import { Card, Space, Typography, theme } from 'antd';
import { useTranslation } from 'react-i18next';
import type { PeriodCounts } from '@avtoschoole/shared';

const CHART_PERIOD_KEYS: Array<Exclude<keyof PeriodCounts, 'day'>> = ['week', 'month', 'year'];
const CHART_HEIGHT = 100;
const BAR_MAX_WIDTH = 34;

/** A small stat card with a headline number and a week/month/year bar chart - shared by the Stats and Superadmin dashboard pages. */
export function MetricBarChart({
  title,
  values,
  color,
  icon,
  suffix,
}: {
  title: string;
  values?: PeriodCounts;
  color: string;
  icon: ReactNode;
  suffix?: string;
}) {
  const { t } = useTranslation();
  const { token } = theme.useToken();
  const periodLabels: Record<Exclude<keyof PeriodCounts, 'day'>, string> = {
    week: t('stats.thisWeek'),
    month: t('stats.thisMonth'),
    year: t('stats.thisYear'),
  };
  const max = Math.max(...CHART_PERIOD_KEYS.map((key) => values?.[key] ?? 0), 1);
  const headline = values?.year ?? 0;

  return (
    <Card size="small" style={{ height: '100%' }}>
      <Space align="start" size={10} style={{ marginBottom: 16 }}>
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
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
            {title}
          </Typography.Text>
          <div>
            <Typography.Text strong style={{ fontSize: 20 }}>
              {headline.toLocaleString()}
              {suffix ? ` ${suffix}` : ''}
            </Typography.Text>
          </div>
        </div>
      </Space>

      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12, height: CHART_HEIGHT }}>
        {CHART_PERIOD_KEYS.map((key) => {
          const value = values?.[key] ?? 0;
          const barHeight = Math.max((value / max) * CHART_HEIGHT, 3);
          return (
            <div
              key={key}
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                height: '100%',
                justifyContent: 'flex-end',
              }}
            >
              <Typography.Text style={{ fontSize: 11, marginBottom: 4 }} type="secondary">
                {value.toLocaleString()}
              </Typography.Text>
              <div
                style={{
                  width: '100%',
                  maxWidth: BAR_MAX_WIDTH,
                  height: barHeight,
                  background: `linear-gradient(180deg, ${color} 0%, ${color}cc 100%)`,
                  borderRadius: '8px 8px 3px 3px',
                }}
              />
            </div>
          );
        })}
      </div>
      <div
        style={{
          display: 'flex',
          gap: 12,
          marginTop: 8,
          borderTop: `1px solid ${token.colorBorderSecondary}`,
          paddingTop: 8,
        }}
      >
        {CHART_PERIOD_KEYS.map((key) => (
          <Typography.Text key={key} type="secondary" style={{ flex: 1, textAlign: 'center', fontSize: 12 }}>
            {periodLabels[key]}
          </Typography.Text>
        ))}
      </div>
    </Card>
  );
}
