import { useState, type ReactNode } from 'react';
import {
  Button,
  Card,
  Col,
  DatePicker,
  Form,
  Input,
  InputNumber,
  Modal,
  Popconfirm,
  Row,
  Segmented,
  Space,
  Statistic,
  Table,
  Tag,
  Typography,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  AccountBookOutlined,
  DeleteOutlined,
  EditOutlined,
  FallOutlined,
  PlusOutlined,
  RiseOutlined,
  WalletOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';
import { CashflowType } from '@avtoschoole/shared';
import {
  useCreateCashflowEntryMutation,
  useDeleteCashflowEntryMutation,
  useMyCashflowQuery,
  useUpdateCashflowEntryMutation,
  type CashflowEntry,
} from '../../app/api/cashflowApi';
import { notifyError, notifySuccess } from '../../shared/utils/notify';
import { ExportExcelButton } from '../../shared/components/ExportExcelButton';
import { exportToExcel } from '../../shared/utils/exportExcel';

interface CashflowFormValues {
  type: CashflowType;
  amount: number;
  date: dayjs.Dayjs;
  note?: string;
}

function SectionIcon({ color, icon }: { color: string; icon: ReactNode }) {
  return (
    <span
      style={{
        width: 28,
        height: 28,
        borderRadius: '50%',
        background: `${color}1f`,
        color,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 14,
      }}
    >
      {icon}
    </span>
  );
}

export function CashflowPage() {
  const { t } = useTranslation();
  const { data: entries, isLoading } = useMyCashflowQuery();
  const [createEntry, { isLoading: isCreating }] = useCreateCashflowEntryMutation();
  const [updateEntry, { isLoading: isUpdating }] = useUpdateCashflowEntryMutation();
  const [deleteEntry] = useDeleteCashflowEntryMutation();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<CashflowEntry | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<dayjs.Dayjs | null>(null);
  const [form] = Form.useForm<CashflowFormValues>();

  const filteredEntries = (entries ?? []).filter(
    (e) => !selectedMonth || dayjs(e.date).isSame(selectedMonth, 'month'),
  );

  const totals = filteredEntries.reduce(
    (acc, e) => {
      if (e.type === CashflowType.INCOME) {
        acc.income += Number(e.amount);
      } else {
        acc.expense += Number(e.amount);
      }
      return acc;
    },
    { income: 0, expense: 0 },
  );
  const net = totals.income - totals.expense;

  const closeModal = () => {
    setModalOpen(false);
    setEditingEntry(null);
    form.resetFields();
  };

  const openCreateModal = () => {
    setEditingEntry(null);
    form.resetFields();
    form.setFieldsValue({ type: CashflowType.EXPENSE, date: dayjs() });
    setModalOpen(true);
  };

  const openEditModal = (entry: CashflowEntry) => {
    setEditingEntry(entry);
    form.setFieldsValue({
      type: entry.type,
      amount: Number(entry.amount),
      date: dayjs(entry.date),
      note: entry.note ?? undefined,
    });
    setModalOpen(true);
  };

  const handleSubmit = async (values: CashflowFormValues) => {
    const body = {
      type: values.type,
      amount: values.amount,
      date: values.date.format('YYYY-MM-DD'),
      note: values.note,
    };
    try {
      if (editingEntry) {
        await updateEntry({ id: editingEntry.id, body }).unwrap();
        notifySuccess(t('notify.cashflowUpdated'));
      } else {
        await createEntry(body).unwrap();
        notifySuccess(t('notify.cashflowAdded'));
      }
      closeModal();
    } catch {
      notifyError(t(editingEntry ? 'notify.cashflowUpdateFailed' : 'notify.cashflowAddFailed'));
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteEntry(id).unwrap();
      notifySuccess(t('notify.cashflowDeleted'));
    } catch {
      notifyError(t('notify.cashflowDeleteFailed'));
    }
  };

  const handleExport = async () => {
    await exportToExcel(t('cashflow.title'), [
      {
        name: t('cashflow.title'),
        columns: [
          { header: t('common.date'), key: 'date', value: (e: CashflowEntry) => e.date },
          {
            header: t('cashflow.type'),
            key: 'type',
            value: (e: CashflowEntry) => t(`cashflow.typeLabel.${e.type}`),
          },
          { header: t('common.amount'), key: 'amount', value: (e: CashflowEntry) => Number(e.amount) },
          { header: t('common.note'), key: 'note', value: (e: CashflowEntry) => e.note ?? '-' },
        ],
        rows: filteredEntries,
      },
    ]);
  };

  const columns: ColumnsType<CashflowEntry> = [
    { title: t('common.date'), dataIndex: 'date', width: 120 },
    {
      title: t('cashflow.type'),
      dataIndex: 'type',
      render: (type: CashflowType) => (
        <Tag color={type === CashflowType.INCOME ? 'green' : 'red'}>{t(`cashflow.typeLabel.${type}`)}</Tag>
      ),
    },
    {
      title: t('common.amount'),
      dataIndex: 'amount',
      render: (v: number, record) => (
        <Typography.Text strong style={{ color: record.type === CashflowType.INCOME ? '#3f8600' : '#cf1322' }}>
          {record.type === CashflowType.INCOME ? '+' : '−'}
          {Number(v).toLocaleString()} {t('billing.currency')}
        </Typography.Text>
      ),
    },
    { title: t('common.note'), dataIndex: 'note', render: (v) => v ?? '-' },
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
          {t('cashflow.title')}
        </Typography.Title>
        <DatePicker
          picker="month"
          placeholder={t('cashflow.filterMonth') ?? ''}
          value={selectedMonth}
          onChange={setSelectedMonth}
          allowClear
        />
      </Space>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title={t('cashflow.totalIncome')}
              value={totals.income}
              prefix={<RiseOutlined />}
              valueStyle={{ color: '#3f8600' }}
              suffix={t('billing.currency')}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title={t('cashflow.totalExpense')}
              value={totals.expense}
              prefix={<FallOutlined />}
              valueStyle={{ color: '#cf1322' }}
              suffix={t('billing.currency')}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title={t('cashflow.netBalance')}
              value={net}
              prefix={<WalletOutlined />}
              valueStyle={{ color: net >= 0 ? '#3f8600' : '#cf1322' }}
              suffix={t('billing.currency')}
            />
          </Card>
        </Col>
      </Row>

      <Card
        title={
          <Space>
            <SectionIcon color="#1677ff" icon={<AccountBookOutlined />} />
            {t('cashflow.title')}
          </Space>
        }
        extra={
          <Space>
            <ExportExcelButton onExport={handleExport} disabled={!filteredEntries.length} />
            <Button type="primary" icon={<PlusOutlined />} onClick={openCreateModal}>
              {t('cashflow.addEntry')}
            </Button>
          </Space>
        }
      >
        <Table<CashflowEntry>
          rowKey="id"
          dataSource={filteredEntries}
          loading={isLoading}
          pagination={false}
          scroll={{ x: true }}
          columns={columns}
        />
      </Card>

      <Modal
        title={editingEntry ? t('cashflow.editTitle') : t('cashflow.addEntry')}
        open={modalOpen}
        onCancel={closeModal}
        onOk={() => form.submit()}
        confirmLoading={editingEntry ? isUpdating : isCreating}
        okText={t('common.save')}
        cancelText={t('common.cancel')}
        destroyOnClose
      >
        <Form<CashflowFormValues>
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{ type: CashflowType.EXPENSE, date: dayjs() }}
        >
          <Form.Item name="type" label={t('cashflow.type')} rules={[{ required: true }]}>
            <Segmented
              block
              options={[
                { value: CashflowType.INCOME, label: t('cashflow.typeLabel.income') },
                { value: CashflowType.EXPENSE, label: t('cashflow.typeLabel.expense') },
              ]}
            />
          </Form.Item>
          <Form.Item name="amount" label={t('common.amount')} rules={[{ required: true }]}>
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="date" label={t('common.date')} rules={[{ required: true }]}>
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="note" label={t('common.note')}>
            <Input.TextArea rows={2} placeholder={t('cashflow.notePlaceholder') ?? ''} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
