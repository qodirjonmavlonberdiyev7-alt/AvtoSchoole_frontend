import { notification } from 'antd';
import type { CSSProperties } from 'react';

const PLACEMENT = 'topRight';
const SUCCESS_DURATION = 3.5;
const ERROR_DURATION = 4.5;

/** Drives the shrinking countdown bar defined in index.css (`--toast-duration`/`--toast-accent`). */
function countdownStyle(duration: number, accent: string): CSSProperties {
  return { '--toast-duration': `${duration}s`, '--toast-accent': accent } as CSSProperties;
}

export function notifySuccess(message: string, description?: string) {
  notification.success({
    message,
    description,
    placement: PLACEMENT,
    duration: SUCCESS_DURATION,
    style: countdownStyle(SUCCESS_DURATION, '#52c41a'),
  });
}

export function notifyError(message: string, description?: string) {
  notification.error({
    message,
    description,
    placement: PLACEMENT,
    duration: ERROR_DURATION,
    style: countdownStyle(ERROR_DURATION, '#ff4d4f'),
  });
}
