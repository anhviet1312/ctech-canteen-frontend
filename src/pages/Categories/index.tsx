import { useState } from 'react'
import { Table, Button, Modal, Form, Input, Popconfirm, Typography, Space, message } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getCategories, createCategory, updateCategory, deleteCategory } from '../../api/categories'
import { useAuthStore } from '../../store/authStore'
import { Category } from '../../types'

const { Title } = Typography

export default function CategoriesPage() {
  const qc = useQueryClient()
  const user = useAuthStore((s) => s.user)
  const isManager = user?.role === 'manager'

  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Category | null>(null)
  const [form] = Form.useForm()

  const { data, isLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: getCategories,
  })

  const categories: Category[] = data?.data ?? []

  const createMut = useMutation({
    mutationFn: createCategory,
    onSuccess: () => {
      message.success('Thêm danh mục thành công!')
      qc.invalidateQueries({ queryKey: ['categories'] })
      setModalOpen(false)
      form.resetFields()
    },
    onError: () => message.error('Có lỗi xảy ra!'),
  })

  const updateMut = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => updateCategory(id, data),
    onSuccess: () => {
      message.success('Cập nhật danh mục thành công!')
      qc.invalidateQueries({ queryKey: ['categories'] })
      setModalOpen(false)
      form.resetFields()
      setEditing(null)
    },
    onError: () => message.error('Có lỗi xảy ra!'),
  })

  const deleteMut = useMutation({
    mutationFn: (id: number) => deleteCategory(id),
    onSuccess: () => {
      message.success('Xóa danh mục thành công!')
      qc.invalidateQueries({ queryKey: ['categories'] })
    },
    onError: () => message.error('Có lỗi xảy ra!'),
  })

  const openCreate = () => {
    setEditing(null)
    form.resetFields()
    setModalOpen(true)
  }

  const openEdit = (item: Category) => {
    setEditing(item)
    form.setFieldsValue(item)
    setModalOpen(true)
  }

  const handleSubmit = async () => {
    const vals = await form.validateFields()
    if (editing) {
      updateMut.mutate({ id: editing.id, data: vals })
    } else {
      createMut.mutate(vals)
    }
  }

  const columns = [
    {
      title: 'STT',
      key: 'stt',
      width: 60,
      render: (_: any, __: any, idx: number) => idx + 1,
    },
    { title: 'Tên danh mục', dataIndex: 'name', key: 'name' },
    { title: 'Mô tả', dataIndex: 'description', key: 'description', render: (v: string) => v || '—' },
    ...(isManager
      ? [
          {
            title: 'Hành động',
            key: 'action',
            width: 150,
            render: (_: any, record: Category) => (
              <Space>
                <Button
                  icon={<EditOutlined />}
                  size="small"
                  onClick={() => openEdit(record)}
                >
                  Sửa
                </Button>
                <Popconfirm
                  title="Xóa danh mục này?"
                  description="Bạn có chắc chắn muốn xóa không?"
                  onConfirm={() => deleteMut.mutate(record.id)}
                  okText="Xóa"
                  cancelText="Hủy"
                >
                  <Button icon={<DeleteOutlined />} size="small" danger>
                    Xóa
                  </Button>
                </Popconfirm>
              </Space>
            ),
          },
        ]
      : []),
  ]

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <Title level={4} style={{ margin: 0 }}>
          📋 Danh mục hàng hóa
        </Title>
        {isManager && (
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
            Thêm danh mục
          </Button>
        )}
      </div>

      <Table
        dataSource={categories}
        columns={columns}
        rowKey="id"
        loading={isLoading}
        pagination={{ pageSize: 15 }}
      />

      <Modal
        title={editing ? 'Sửa danh mục' : 'Thêm danh mục'}
        open={modalOpen}
        onOk={handleSubmit}
        onCancel={() => {
          setModalOpen(false)
          form.resetFields()
          setEditing(null)
        }}
        confirmLoading={createMut.isPending || updateMut.isPending}
        okText={editing ? 'Cập nhật' : 'Thêm'}
        cancelText="Hủy"
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item
            name="name"
            label="Tên danh mục"
            rules={[{ required: true, message: 'Vui lòng nhập tên danh mục!' }]}
          >
            <Input placeholder="Nhập tên danh mục" />
          </Form.Item>
          <Form.Item name="description" label="Mô tả">
            <Input.TextArea rows={3} placeholder="Nhập mô tả" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
