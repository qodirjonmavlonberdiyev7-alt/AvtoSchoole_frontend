import { useState } from 'react';
import { Button, DatePicker, Form, Input, Modal, Popconfirm, Space, Table, Tag, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { DeleteOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';
import {
  useCreateInsuranceMutation,
  useDeleteInsuranceMutation,
  useMyInsuranceQuery,
  useUpdateInsuranceMutation,
  type InsuranceRecord,
} from '../../app/api/insuranceApi';
import { notifyError, notifySuccess } from '../../shared/utils/notify';
import { ExportExcelButton } from '../../shared/components/ExportExcelButton';
import { exportToExcel } from '../../shared/utils/exportExcel';

interface InsuranceFormValues {
  insuredAt: dayjs.Dayjs;
  expiresAt: dayjs.Dayjs;
  phone: string;
  fullName: string;
  carBrand: string;
  plateNumber: string;
}

function daysUntil(dateStr: string): number {
  return dayjs(dateStr).startOf('day').diff(dayjs().startOf('day'), 'day');
}

export function InsurancePage() {
  const { t } = useTranslation();
  const { data, isLoading } = useMyInsuranceQuery();
  const [createInsurance, { isLoading: isCreating }] = useCreateInsuranceMutation();
  const [updateInsurance, { isLoading: isUpdating }] = useUpdateInsuranceMutation();
  const [deleteInsurance] = useDeleteInsuranceMutation();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<InsuranceRecord | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<dayjs.Dayjs | null>(null);
  const [form] = Form.useForm<InsuranceFormValues>();

  const filteredData = (data ?? []).filter(
    (r) => !selectedMonth || dayjs(r.insuredAt).isSame(selectedMonth, 'month'),
  );

  const openCreateModal = () => {
    setEditingRecord(null);
    form.resetFields();
    setModalOpen(true);
  };

  const openEditModal = (record: InsuranceRecord) => {
    setEditingRecord(record);
    form.setFieldsValue({
      fullName: record.fullName,
      phone: record.phone,
      carBrand: record.carBrand,
      plateNumber: record.plateNumber,
      insuredAt: dayjs(record.insuredAt),
      expiresAt: dayjs(record.expiresAt),
    });
    setModalOpen(true);
  };

  const handleSubmit = async (values: InsuranceFormValues) => {
    const body = {
      insuredAt: values.insuredAt.format('YYYY-MM-DD'),
      expiresAt: values.expiresAt.format('YYYY-MM-DD'),
      phone: values.phone,
      fullName: values.fullName,
      carBrand: values.carBrand,
      plateNumber: values.plateNumber,
    };
    try {
      if (editingRecord) {
        await updateInsurance({ id: editingRecord.id, body }).unwrap();
        notifySuccess(t('notify.insuranceUpdated'));
      } else {
        await createInsurance(body).unwrap();
        notifySuccess(t('notify.insuranceAdded'));
      }
      setModalOpen(false);
      setEditingRecord(null);
      form.resetFields();
    } catch {
      notifyError(t(editingRecord ? 'notify.insuranceUpdateFailed' : 'notify.insuranceAddFailed'));
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteInsurance(id).unwrap();
      notifySuccess(t('notify.insuranceDeleted'));
    } catch {
      notifyError(t('notify.insuranceDeleteFailed'));
    }
  };

  const handleExport = async () => {
    await exportToExcel(t('insurance.title'), [
      {
        name: t('insurance.title'),
        columns: [
          { header: t('insurance.clientFullName'), key: 'fullName', value: (r: InsuranceRecord) => r.fullName },
          { header: t('insurance.clientPhone'), key: 'phone', value: (r: InsuranceRecord) => r.phone },
          { header: t('insurance.carBrand'), key: 'carBrand', value: (r: InsuranceRecord) => r.carBrand },
          { header: t('insurance.plateNumber'), key: 'plateNumber', value: (r: InsuranceRecord) => r.plateNumber },
          { header: t('insurance.insuredAt'), key: 'insuredAt', value: (r: InsuranceRecord) => r.insuredAt },
          { header: t('insurance.expiresAt'), key: 'expiresAt', value: (r: InsuranceRecord) => r.expiresAt },
        ],
        rows: filteredData,
      },
    ]);
  };

  const columns: ColumnsType<InsuranceRecord> = [
    { title: t('insurance.clientFullName'), dataIndex: 'fullName' },
    { title: t('insurance.clientPhone'), dataIndex: 'phone' },
    { title: t('insurance.carBrand'), dataIndex: 'carBrand' },
    { title: t('insurance.plateNumber'), dataIndex: 'plateNumber' },
    { title: t('insurance.insuredAt'), dataIndex: 'insuredAt' },
    {
      title: t('insurance.expiresAt'),
      dataIndex: 'expiresAt',
      render: (expiresAt: string) => {
        const remaining = daysUntil(expiresAt);
        const color = remaining <= 10 ? 'red' : remaining <= 30 ? 'orange' : 'default';
        return (
          <Tag color={color}>
            {expiresAt} ({remaining}d)
          </Tag>
        );
      },
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
      <Space style={{ marginBottom: 16, width: '100%', justifyContent: 'space-between' }} wrap>
        <Typography.Title level={4} style={{ margin: 0 }}>
          {t('insurance.title')}
        </Typography.Title>
        <Space wrap>
          <DatePicker
            picker="month"
            placeholder={t('insurance.filterMonth') ?? ''}
            value={selectedMonth}
            onChange={setSelectedMonth}
            allowClear
          />
          <ExportExcelButton onExport={handleExport} disabled={!filteredData.length} />
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreateModal}>
            {t('common.create')}
          </Button>
        </Space>
      </Space>

      <Table<InsuranceRecord>
        rowKey="id"
        columns={columns}
        dataSource={filteredData}
        loading={isLoading}
        scroll={{ x: true }}
        pagination={false}
      />

      <Modal
        title={editingRecord ? t('insurance.editTitle') : t('insurance.createTitle')}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={() => form.submit()}
        confirmLoading={editingRecord ? isUpdating : isCreating}
        okText={t('common.save')}
        cancelText={t('common.cancel')}
        destroyOnClose
      >
        <Form<InsuranceFormValues> form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item name="fullName" label={t('insurance.clientFullName')} rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="phone" label={t('insurance.clientPhone')} rules={[{ required: true }]}>
            <Input placeholder="+998901234567" />
          </Form.Item>
          <Form.Item name="carBrand" label={t('insurance.carBrand')} rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="plateNumber" label={t('insurance.plateNumber')} rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="insuredAt" label={t('insurance.insuredAt')} rules={[{ required: true }]}>
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="expiresAt" label={t('insurance.expiresAt')} rules={[{ required: true }]}>
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
