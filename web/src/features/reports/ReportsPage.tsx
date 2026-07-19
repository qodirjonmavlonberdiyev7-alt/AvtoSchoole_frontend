import { useState } from 'react';
import { Button, DatePicker, Form, Image, Input, Modal, Popconfirm, Space, Table, Typography, Upload } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { UploadFile } from 'antd/es/upload/interface';
import { DeleteOutlined, EditOutlined, FileImageOutlined, PlusOutlined, UploadOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';
import {
  getReportImageUrl,
  useCreateReportMutation,
  useDeleteReportMutation,
  useMyReportsQuery,
  useUpdateReportMutation,
  type ReportEntry,
} from '../../app/api/reportsApi';
import { notifyError, notifySuccess } from '../../shared/utils/notify';

interface ReportFormValues {
  date: dayjs.Dayjs;
  note?: string;
}

export function ReportsPage() {
  const { t } = useTranslation();
  const { data, isLoading } = useMyReportsQuery();
  const [createReport, { isLoading: isCreating }] = useCreateReportMutation();
  const [updateReport, { isLoading: isUpdating }] = useUpdateReportMutation();
  const [deleteReport] = useDeleteReportMutation();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingReport, setEditingReport] = useState<ReportEntry | null>(null);
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [previewImage, setPreviewImage] = useState('');
  const [previewOpen, setPreviewOpen] = useState(false);
  const [form] = Form.useForm<ReportFormValues>();

  const openCreateModal = () => {
    setEditingReport(null);
    setFileList([]);
    form.resetFields();
    form.setFieldsValue({ date: dayjs() });
    setModalOpen(true);
  };

  const openEditModal = (record: ReportEntry) => {
    setEditingReport(record);
    setFileList(
      record.images.map((filename) => ({
        uid: filename,
        name: filename,
        status: 'done',
        url: getReportImageUrl(filename),
      })),
    );
    form.setFieldsValue({ date: dayjs(record.date), note: record.note ?? undefined });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingReport(null);
    setFileList([]);
    form.resetFields();
  };

  const handlePreview = async (file: UploadFile) => {
    if (!file.url && !file.preview && file.originFileObj) {
      file.preview = URL.createObjectURL(file.originFileObj);
    }
    setPreviewImage(file.url ?? file.preview ?? '');
    setPreviewOpen(true);
  };

  const handleSubmit = async (values: ReportFormValues) => {
    const body = new FormData();
    body.append('date', values.date.format('YYYY-MM-DD'));
    if (values.note) {
      body.append('note', values.note);
    }
    fileList
      .filter((file) => file.originFileObj)
      .forEach((file) => body.append('images', file.originFileObj as File));

    try {
      if (editingReport) {
        const keptFilenames = fileList.filter((file) => !file.originFileObj).map((file) => file.uid);
        const removedFilenames = editingReport.images.filter((filename) => !keptFilenames.includes(filename));
        if (removedFilenames.length > 0) {
          body.append('removeImages', JSON.stringify(removedFilenames));
        }
        await updateReport({ id: editingReport.id, body }).unwrap();
        notifySuccess(t('notify.reportUpdated'));
      } else {
        await createReport(body).unwrap();
        notifySuccess(t('notify.reportAdded'));
      }
      closeModal();
    } catch {
      notifyError(t(editingReport ? 'notify.reportUpdateFailed' : 'notify.reportAddFailed'));
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteReport(id).unwrap();
      notifySuccess(t('notify.reportDeleted'));
    } catch {
      notifyError(t('notify.reportDeleteFailed'));
    }
  };

  const columns: ColumnsType<ReportEntry> = [
    { title: t('common.date'), dataIndex: 'date', width: 120 },
    {
      title: t('common.note'),
      dataIndex: 'note',
      render: (note: string | null) => note || <Typography.Text type="secondary">-</Typography.Text>,
    },
    {
      title: t('reports.images'),
      dataIndex: 'images',
      render: (images: string[]) =>
        images.length > 0 ? (
          <Image.PreviewGroup>
            <Space size={4} wrap>
              {images.map((filename) => (
                <Image
                  key={filename}
                  src={getReportImageUrl(filename)}
                  width={44}
                  height={44}
                  style={{ objectFit: 'cover', borderRadius: 6 }}
                />
              ))}
            </Space>
          </Image.PreviewGroup>
        ) : (
          <Typography.Text type="secondary">{t('reports.noImages')}</Typography.Text>
        ),
    },
    {
      title: t('common.actions'),
      render: (_, record) => (
        <Space size="small">
          <Button size="small" icon={<EditOutlined />} onClick={() => openEditModal(record)} />
          <Popconfirm title={t('common.deleteConfirm')} onConfirm={() => handleDelete(record.id)}>
            <Button danger size="small" icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Space style={{ marginBottom: 16, width: '100%', justifyContent: 'space-between' }}>
        <Typography.Title level={4} style={{ margin: 0 }}>
          <FileImageOutlined style={{ marginInlineEnd: 8 }} />
          {t('reports.title')}
        </Typography.Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreateModal}>
          {t('reports.addEntry')}
        </Button>
      </Space>

      <Table<ReportEntry>
        rowKey="id"
        columns={columns}
        dataSource={data}
        loading={isLoading}
        scroll={{ x: true }}
        pagination={false}
      />

      <Modal
        title={editingReport ? t('reports.editTitle') : t('reports.addEntry')}
        open={modalOpen}
        onCancel={closeModal}
        onOk={() => form.submit()}
        confirmLoading={editingReport ? isUpdating : isCreating}
        okText={t('common.save')}
        cancelText={t('common.cancel')}
        destroyOnClose
      >
        <Form<ReportFormValues> form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item name="date" label={t('common.date')} rules={[{ required: true }]}>
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="note" label={t('common.note')}>
            <Input.TextArea rows={3} placeholder={t('reports.notePlaceholder') ?? ''} />
          </Form.Item>
          <Form.Item label={t('reports.images')}>
            <Upload
              listType="picture-card"
              fileList={fileList}
              beforeUpload={() => false}
              onChange={({ fileList: next }) => setFileList(next)}
              onPreview={handlePreview}
              onRemove={(file) => setFileList((prev) => prev.filter((f) => f.uid !== file.uid))}
              accept="image/*"
              multiple
              maxCount={10}
            >
              {fileList.length >= 10 ? null : (
                <div>
                  <UploadOutlined />
                  <div style={{ marginTop: 8 }}>{t('reports.uploadHint')}</div>
                </div>
              )}
            </Upload>
          </Form.Item>
        </Form>
      </Modal>

      {previewImage && (
        <Image
          style={{ display: 'none' }}
          src={previewImage}
          preview={{
            visible: previewOpen,
            onVisibleChange: setPreviewOpen,
            afterOpenChange: (visible) => {
              if (!visible) {
                setPreviewImage('');
              }
            },
          }}
        />
      )}
    </div>
  );
}
