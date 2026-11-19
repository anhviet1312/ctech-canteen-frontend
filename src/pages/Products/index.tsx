import { useState } from 'react'
import {
  Table, Button, Modal, Form, Input, InputNumber, Select, Popconfirm,
  Typography, Space, message, Tag, Checkbox, Row, Col,
} from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined, WarningOutlined } from '@ant-design/icons'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getProducts, createProduct, updateProduct, deleteProduct } from '../../api/products'
import { getCategories } from '../../api/categories'
import { getSuppliers } from '../../api/suppliers'
import { useAuthStore } from '../../store/authStore'
import { Product, Category, Supplier } from '../../types'

const { Title } = Typography
const { Option } = Select

const UNITS = ['cái', 'hộp', 'chai', 'gói', 'lon', 'kg', 'lít', 'bộ', 'cuộn', 'tờ']
const fmtVND = (val: number) => val?.toLocaleString('vi-VN') + ' ₫'

export default function ProductsPage() {
  const qc = useQueryClient()
  const user = useAuthStore((s) => s.user)
  const isManager = user?.role === 'manager'

  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Product | null>(null)
  const [search, setSearch] = useState('')
  const [catFilter, setCatFilter] = useState<number | null>(null)
  const [lowStockOnly, setLowStockOnly] = useState(false)
  const [form] = Form.useForm()

  const { data: prodData, isLoading } = useQuery({
    queryKey: ['products'],
    queryFn: () => getProducts(),
  })

  const { data: catData } = useQuery({ queryKey: ['categories'], queryFn: getCategories })
  const { data: supData } = useQuery({ queryKey: ['suppliers'], queryFn: getSuppliers })

  const allProducts: Product[] = prodData?.data ?? []
  const categories: Category[] = catData?.data ?? []
  const suppliers: Supplier[] = supData?.data ?? []

  const filtered = allProducts.filter((p) => {
    const matchSearch =
      !search ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.code.toLowerCase().includes(search.toLowerCase())
    const matchCat = !catFilter || p.category_id === catFilter
    const matchLow = !lowStockOnly || p.current_stock < p.min_quantity
    return matchSearch && matchCat && matchLow
  })

  const createMut = useMutation({
    mutationFn: createProduct,
    onSuccess: () => {
      message.success('Thêm mặt hàng thành công!')
      qc.invalidateQueries({ queryKey: ['products'] })
      setModalOpen(false)
      form.resetFields()
    },
    onError: () => message.error('Có lỗi xảy ra!'),
  })

  const updateMut = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => updateProduct(id, data),
    onSuccess: () => {
      message.success('Cập nhật mặt hàng thành công!')
      qc.invalidateQueries({ queryKey: ['products'] })
      setModalOpen(false)
      form.resetFields()
      setEditing(null)
    },
    onError: () => message.error('Có lỗi xảy ra!'),
  })

  const deleteMut = useMutation({
    mutationFn: (id: number) => deleteProduct(id),
    onSuccess: () => {
      message.success('Xóa mặt hàng thành công!')
      qc.invalidateQueries({ queryKey: ['products'] })
    },
    onError: () => message.error('Có lỗi xảy ra!'),
  })

  const openCreate = () => {
    setEditing(null)
    form.resetFields()
    setModalOpen(true)
  }

  const openEdit = (item: Product) => {
    setEditing(item)
    form.setFieldsValue({
      ...item,
      category_id: item.category_id ?? undefined,
      supplier_id: item.supplier_id ?? undefined,
    })
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
    { title: 'Mã', dataIndex: 'code', key: 'code', width: 100 },
    { title: 'Tên hàng', dataIndex: 'name', key: 'name' },
    {
      title: 'Danh mục',
      key: 'category',
      render: (_: any, r: Product) => r.category?.name ?? '—',
    },
    {
      title: 'Nhà cung cấp',
      key: 'supplier',
      render: (_: any, r: Product) => r.supplier?.name ?? '—',
    },
    { title: 'Đơn vị', dataIndex: 'unit', key: 'unit', width: 80 },
    {
      title: 'Tồn kho',
      dataIndex: 'current_stock',
      key: 'current_stock',
      width: 100,
      render: (val: number, r: Product) =>
        val < r.min_quantity ? (
          <span style={{ color: '#ff4d4f', fontWeight: 600 }}>
            <WarningOutlined /> {val}
          </span>
        ) : (
          <span style={{ color: '#52c41a', fontWeight: 600 }}>{val}</span>
        ),
    },
    { title: 'Tối thiểu', dataIndex: 'min_quantity', key: 'min_quantity', width: 90 },
    {
      title: 'Đơn giá',
      dataIndex: 'price',
      key: 'price',
      render: (v: number) => fmtVND(v),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'is_active',
      key: 'is_active',
      render: (v: boolean) => (
        <Tag color={v ? 'green' : 'red'}>{v ? 'Đang bán' : 'Ngừng bán'}</Tag>
      ),
    },
    ...(isManager
      ? [
          {
            title: 'Hành động',
            key: 'action',
            width: 150,
            render: (_: any, record: Product) => (
              <Space>
                <Button icon={<EditOutlined />} size="small" onClick={() => openEdit(record)}>
                  Sửa
                </Button>
                <Popconfirm
                  title="Xóa mặt hàng này?"
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
          📦 Danh mục mặt hàng
        </Title>
        {isManager && (
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
            Thêm mặt hàng
          </Button>
        )}
      </div>

      <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={10}>
          <Input.Search
            placeholder="Tìm theo tên hoặc mã hàng..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            allowClear
          />
        </Col>
        <Col xs={24} sm={8}>
          <Select
            placeholder="Lọc theo danh mục"
            allowClear
            style={{ width: '100%' }}
            value={catFilter}
            onChange={(v) => setCatFilter(v)}
          >
            {categories.map((c) => (
              <Option key={c.id} value={c.id}>
                {c.name}
              </Option>
            ))}
          </Select>
        </Col>
        <Col xs={24} sm={6}>
          <Checkbox
            checked={lowStockOnly}
            onChange={(e) => setLowStockOnly(e.target.checked)}
          >
            Chỉ hàng dưới ngưỡng
          </Checkbox>
        </Col>
      </Row>

      <Table
        dataSource={filtered}
        columns={columns}
        rowKey="id"
        loading={isLoading}
        pagination={{ pageSize: 15 }}
        scroll={{ x: 1100 }}
      />

      <Modal
        title={editing ? 'Sửa mặt hàng' : 'Thêm mặt hàng'}
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
        width={700}
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Row gutter={16}>
            <Col span={14}>
              <Form.Item
                name="name"
                label="Tên hàng hóa"
                rules={[{ required: true, message: 'Vui lòng nhập tên hàng hóa!' }]}
              >
                <Input placeholder="Nhập tên hàng hóa" />
              </Form.Item>
            </Col>
            <Col span={10}>
              <Form.Item
                name="code"
                label="Mã hàng"
                rules={[{ required: true, message: 'Vui lòng nhập mã hàng!' }]}
              >
                <Input placeholder="Nhập mã hàng" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="category_id" label="Danh mục">
                <Select placeholder="Chọn danh mục" allowClear>
                  {categories.map((c) => (
                    <Option key={c.id} value={c.id}>
                      {c.name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="supplier_id" label="Nhà cung cấp">
                <Select placeholder="Chọn nhà cung cấp" allowClear>
                  {suppliers.map((s) => (
                    <Option key={s.id} value={s.id}>
                      {s.name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="unit" label="Đơn vị">
                <Select placeholder="Chọn đơn vị">
                  {UNITS.map((u) => (
                    <Option key={u} value={u}>
                      {u}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="min_quantity" label="Tồn kho tối thiểu">
                <InputNumber min={0} style={{ width: '100%' }} placeholder="0" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="price" label="Đơn giá nhập (₫)">
                <InputNumber min={0} style={{ width: '100%' }} placeholder="0" formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="description" label="Mô tả">
            <Input.TextArea rows={2} placeholder="Nhập mô tả" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
