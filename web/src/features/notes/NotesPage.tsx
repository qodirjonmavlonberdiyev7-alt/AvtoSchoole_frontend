import { useState } from 'react';
import { Button, Col, Empty, Form, Image, Input, Modal, Popconfirm, Row, Space, Typography, Upload, Card } from 'antd';
import type { UploadFile } from 'antd/es/upload/interface';
import { DeleteOutlined, EditOutlined, FileTextOutlined, PlusOutlined, UploadOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';
import {
  getNoteImageUrl,
  useCreateNoteMutation,
  useDeleteNoteMutation,
  useMyNotesQuery,
  useUpdateNoteMutation,
  type Note,
} from '../../app/api/notesApi';
import { notifyError, notifySuccess } from '../../shared/utils/notify';

interface NoteFormValues {
  title?: string;
  content: string;
}

export function NotesPage() {
  const { t } = useTranslation();
  const { data, isLoading } = useMyNotesQuery();
  const [createNote, { isLoading: isCreating }] = useCreateNoteMutation();
  const [updateNote, { isLoading: isUpdating }] = useUpdateNoteMutation();
  const [deleteNote] = useDeleteNoteMutation();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [previewImage, setPreviewImage] = useState('');
  const [previewOpen, setPreviewOpen] = useState(false);
  const [form] = Form.useForm<NoteFormValues>();

  const openCreateModal = () => {
    setEditingNote(null);
    setFileList([]);
    form.resetFields();
    setModalOpen(true);
  };

  const openEditModal = (note: Note) => {
    setEditingNote(note);
    setFileList(
      note.images.map((filename) => ({
        uid: filename,
        name: filename,
        status: 'done',
        url: getNoteImageUrl(filename),
      })),
    );
    form.setFieldsValue({ title: note.title ?? undefined, content: note.content });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingNote(null);
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

  const handleSubmit = async (values: NoteFormValues) => {
    const body = new FormData();
    if (values.title) {
      body.append('title', values.title);
    }
    body.append('content', values.content);
    fileList.filter((file) => file.originFileObj).forEach((file) => body.append('images', file.originFileObj as File));

    try {
      if (editingNote) {
        const keptFilenames = fileList.filter((file) => !file.originFileObj).map((file) => file.uid);
        const removedFilenames = editingNote.images.filter((filename) => !keptFilenames.includes(filename));
        if (removedFilenames.length > 0) {
          body.append('removeImages', JSON.stringify(removedFilenames));
        }
        await updateNote({ id: editingNote.id, body }).unwrap();
        notifySuccess(t('notify.noteUpdated'));
      } else {
        await createNote(body).unwrap();
        notifySuccess(t('notify.noteAdded'));
      }
      closeModal();
    } catch {
      notifyError(t(editingNote ? 'notify.noteUpdateFailed' : 'notify.noteAddFailed'));
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteNote(id).unwrap();
      notifySuccess(t('notify.noteDeleted'));
    } catch {
      notifyError(t('notify.noteDeleteFailed'));
    }
  };

  return (
    <div>
      <Space style={{ marginBottom: 16, width: '100%', justifyContent: 'space-between' }}>
        <Typography.Title level={4} style={{ margin: 0 }}>
          <FileTextOutlined style={{ marginInlineEnd: 8 }} />
          {t('notes.title')}
        </Typography.Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreateModal}>
          {t('notes.addEntry')}
        </Button>
      </Space>

      {!isLoading && (data ?? []).length === 0 ? (
        <Empty description={t('notes.empty')} />
      ) : (
        <Row gutter={[16, 16]}>
          {(data ?? []).map((note) => (
            <Col key={note.id} xs={24} sm={12} lg={8}>
              <Card
                title={note.title || t('notes.untitled')}
                actions={[
                  <EditOutlined key="edit" onClick={() => openEditModal(note)} />,
                  <Popconfirm key="delete" title={t('common.deleteConfirm')} onConfirm={() => handleDelete(note.id)}>
                    <DeleteOutlined />
                  </Popconfirm>,
                ]}
              >
                <Typography.Paragraph ellipsis={{ rows: 4 }} style={{ minHeight: 66, whiteSpace: 'pre-wrap' }}>
                  {note.content}
                </Typography.Paragraph>

                {note.images.length > 0 && (
                  <Image.PreviewGroup>
                    <Space size={4} wrap style={{ marginBottom: 12 }}>
                      {note.images.map((filename) => (
                        <Image
                          key={filename}
                          src={getNoteImageUrl(filename)}
                          width={44}
                          height={44}
                          style={{ objectFit: 'cover', borderRadius: 6 }}
                        />
                      ))}
                    </Space>
                  </Image.PreviewGroup>
                )}

                <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                  {dayjs(note.updatedAt).format('DD.MM.YYYY HH:mm')}
                </Typography.Text>
              </Card>
            </Col>
          ))}
        </Row>
      )}

      <Modal
        title={editingNote ? t('notes.editTitle') : t('notes.addEntry')}
        open={modalOpen}
        onCancel={closeModal}
        onOk={() => form.submit()}
        confirmLoading={editingNote ? isUpdating : isCreating}
        okText={t('common.save')}
        cancelText={t('common.cancel')}
        destroyOnClose
      >
        <Form<NoteFormValues> form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item name="title" label={t('notes.noteTitle')}>
            <Input placeholder={t('notes.noteTitlePlaceholder') ?? ''} />
          </Form.Item>
          <Form.Item name="content" label={t('notes.content')} rules={[{ required: true }]}>
            <Input.TextArea rows={4} placeholder={t('notes.contentPlaceholder') ?? ''} />
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
