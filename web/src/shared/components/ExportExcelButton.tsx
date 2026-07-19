import { useState } from 'react';
import { Button } from 'antd';
import { FileExcelOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { notifyError } from '../utils/notify';

/** A "Export to Excel" button - shared across every list/table page so the label, icon, loading state and error handling stay consistent. */
export function ExportExcelButton({ onExport, disabled }: { onExport: () => Promise<void>; disabled?: boolean }) {
  const { t } = useTranslation();
  const [isExporting, setIsExporting] = useState(false);

  const handleClick = async () => {
    setIsExporting(true);
    try {
      await onExport();
    } catch {
      notifyError(t('notify.exportFailed'));
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Button icon={<FileExcelOutlined />} loading={isExporting} disabled={disabled} onClick={handleClick}>
      {t('common.exportExcel')}
    </Button>
  );
}
