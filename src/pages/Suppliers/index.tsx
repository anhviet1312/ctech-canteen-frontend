import { useState } from 'react'
import { Table, Button, Modal, Form, Input, Popconfirm, Typography, Space, message } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getSuppliers, createSupplier, updateSupplier, deleteSupplier } from '../../api/suppliers'
import { useAuthStore } from '../../store/authStore'
import { Supplier } from '../../types'

const { Title } = Typography

export default function SuppliersPage() {
  const qc = useQueryClient()
  const user = useAuthStore((s) => s.user)
  const isManager = user?.role === 'manager'

  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Supplier | null>(null)
  const [form] = Form.useForm()

  const { data, isLoading } = useQuery({
    queryKey: ['suppliers'],
    queryFn: getSuppliers,
  })

  const suppliers: Supplier[] = data?.data ?? []

  const createMut = useMutation({
    mutationFn: createSupplier,
    onSuccess: () => {
      message.success('Thêm nhà cung cấp thành công!')
      qc.invalidateQueries({ queryKey: ['suppliers'] })
      setModalOpen(false)
      form.resetFields()
    },
    onError: () => message.error('Có lỗi xảy ra!'),
  })

  const updateMut = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => updateSupplier(id, data),
    onSuccess: () => {
      message.success('Cập nhật nhà cung cấp thành công!')
      qc.invalidateQueries({ queryKey: ['suppliers'] })
      setModalOpen(false)
      form.resetFields()
      setEditing(null)
    },
    onError: () => message.error('Có lỗi xảy ra!'),
  })

  const deleteMut = useMutation({
    mutationFn: (id: number) => deleteSupplier(id),
    onSuccess: () => {
      message.success('Xóa nhà cung cấp thành công!')
      qc.invalidateQueries({ queryKey: ['suppliers'] })
    },
    onError: () => message.error('Có lỗi xảy ra!'),
  })

  const openCreate = () => {
    setEditing(null)
    form.resetFields()
    setModalOpen(true)
  }

  const openEdit = (item: Supplier) => {
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
    { title: 'STT', key: 'stt', width: 60, render: (_: any, __: any, idx: number) => idx + 1 },
    { title: 'Tên nhà cung cấp', dataIndex: 'name', key: 'name' },
    { title: 'Điện thoại', dataIndex: 'phone', key: 'phone', render: (v: string) => v || '—' },
    { title: 'Email', dataIndex: 'email', key: 'email', render: (v: string) => v || '—' },
    { title: 'Địa chỉ', dataIndex: 'address', key: 'address', render: (v: string) => v || '—' },
    ...(isManager
      ? [
          {
            title: 'Hành động',
            key: 'action',
            width: 150,
            render: (_: any, record: Supplier) => (
              <Space>
                <Button icon={<EditOutlined />} size="small" onClick={() => openEdit(record)}>
                  Sửa
                </Button>
                <Popconfirm
                  title="Xóa nhà cung cấp này?"
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
          🏭 Nhà cung cấp
        </Title>
        {isManager && (
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
            Thêm nhà cung cấp
          </Button>
        )}
      </div>

      <Table
        dataSource={suppliers}
        columns={columns}
        rowKey="id"
        loading={isLoading}
        pagination={{ pageSize: 15 }}
      />

      <Modal
        title={editing ? 'Sửa nhà cung cấp' : 'Thêm nhà cung cấp'}
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
        width={600}
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item
            name="name"
            label="Tên nhà cung cấp"
            rules={[{ required: true, message: 'Vui lòng nhập tên nhà cung cấp!' }]}
          >
            <Input placeholder="Nhập tên nhà cung cấp" />
          </Form.Item>
          <Form.Item name="phone" label="Điện thoại">
            <Input placeholder="Nhập số điện thoại" />
          </Form.Item>
          <Form.Item name="email" label="Email">
            <Input placeholder="Nhập email" type="email" />
          </Form.Item>
          <Form.Item name="address" label="Địa chỉ">
            <Input.TextArea rows={2} placeholder="Nhập địa chỉ" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
