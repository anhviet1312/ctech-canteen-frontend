import { useState } from 'react'
import {
  Form, Input, Select, Button, Typography, Card, Table, InputNumber,
  DatePicker, Space, Divider, message, Statistic,
} from 'antd'
import { PlusOutlined, DeleteOutlined, ArrowLeftOutlined } from '@ant-design/icons'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { createImport } from '../../api/imports'
import { getSuppliers } from '../../api/suppliers'
import { getProducts } from '../../api/products'
import { getProposals } from '../../api/proposals'
import { Product, Supplier, Proposal } from '../../types'
import dayjs from 'dayjs'

const { Title } = Typography
const { Option } = Select

const fmtVND = (val: number) => val?.toLocaleString('vi-VN') + ' ₫'

interface ImportItemRow {
  key: string
  product_id: number | null
  quantity: number
  unit_price: number
  expiry_date: dayjs.Dayjs | null
}

export default function CreateImportPage() {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [form] = Form.useForm()
  const [items, setItems] = useState<ImportItemRow[]>([
    { key: '1', product_id: null, quantity: 1, unit_price: 0, expiry_date: null },
  ])

  const { data: supData } = useQuery({ queryKey: ['suppliers'], queryFn: getSuppliers })
  const { data: prodData } = useQuery({ queryKey: ['products'], queryFn: () => getProducts() })
  const { data: propData } = useQuery({
    queryKey: ['proposals', { status: 'APPROVED' }],
    queryFn: () => getProposals({ status: 'APPROVED' }),
  })

  const suppliers: Supplier[] = supData?.data ?? []
  const products: Product[] = prodData?.data ?? []
  const proposals: Proposal[] = propData?.data ?? []

  const addItem = () => {
    setItems([...items, { key: Date.now().toString(), product_id: null, quantity: 1, unit_price: 0, expiry_date: null }])
  }

  const removeItem = (key: string) => {
    setItems(items.filter((i) => i.key !== key))
  }

  const updateItem = (key: string, field: keyof ImportItemRow, value: any) => {
    setItems(items.map((i) => (i.key === key ? { ...i, [field]: value } : i)))
  }

  const totalAmount = items.reduce((s, i) => s + (i.quantity || 0) * (i.unit_price || 0), 0)

  const mutation = useMutation({
    mutationFn: createImport,
    onSuccess: () => {
      message.success('Tạo phiếu nhập thành công!')
      qc.invalidateQueries({ queryKey: ['imports'] })
      navigate('/imports')
    },
    onError: () => message.error('Có lỗi xảy ra khi tạo phiếu nhập!'),
  })

  const handleSubmit = async () => {
    const vals = await form.validateFields()
    const validItems = items.filter((i) => i.product_id && i.quantity > 0)
    if (validItems.length === 0) {
      message.warning('Vui lòng thêm ít nhất một mặt hàng!')
      return
    }
    mutation.mutate({
      ...vals,
      items: validItems.map((i) => ({
        product_id: i.product_id,
        quantity: i.quantity,
        unit_price: i.unit_price,
        expiry_date: i.expiry_date ? i.expiry_date.format('YYYY-MM-DD') : null,
      })),
    })
  }

  const itemColumns = [
    {
      title: 'Hàng hóa',
      key: 'product',
      width: '35%',
      render: (_: any, row: ImportItemRow) => (
        <Select
          showSearch
          placeholder="Chọn hàng hóa"
          style={{ width: '100%' }}
          value={row.product_id ?? undefined}
          onChange={(v) => {
            updateItem(row.key, 'product_id', v)
            const p = products.find((pr) => pr.id === v)
            if (p) updateItem(row.key, 'unit_price', p.price)
          }}
          filterOption={(input, option) =>
            String(option?.children ?? '').toLowerCase().includes(input.toLowerCase())
          }
        >
          {products.map((p) => (
            <Option key={p.id} value={p.id}>
              [{p.code}] {p.name} ({p.unit})
            </Option>
          ))}
        </Select>
      ),
    },
    {
      title: 'Số lượng',
      key: 'quantity',
      width: '15%',
      render: (_: any, row: ImportItemRow) => (
        <InputNumber
          min={1}
          value={row.quantity}
          onChange={(v) => updateItem(row.key, 'quantity', v ?? 1)}
          style={{ width: '100%' }}
        />
      ),
    },
    {
      title: 'Đơn giá (₫)',
      key: 'unit_price',
      width: '20%',
      render: (_: any, row: ImportItemRow) => (
        <InputNumber
          min={0}
          value={row.unit_price}
          onChange={(v) => updateItem(row.key, 'unit_price', v ?? 0)}
          style={{ width: '100%' }}
          formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
        />
      ),
    },
    {
      title: 'Hạn sử dụng',
      key: 'expiry_date',
      width: '20%',
      render: (_: any, row: ImportItemRow) => (
        <DatePicker
          format="DD/MM/YYYY"
          value={row.expiry_date}
          onChange={(v) => updateItem(row.key, 'expiry_date', v)}
          style={{ width: '100%' }}
          placeholder="Không có"
        />
      ),
    },
    {
      title: 'Thành tiền',
      key: 'subtotal',
      render: (_: any, row: ImportItemRow) => fmtVND((row.quantity || 0) * (row.unit_price || 0)),
    },
    {
      title: '',
      key: 'del',
      width: 50,
      render: (_: any, row: ImportItemRow) => (
        <Button
          danger
          icon={<DeleteOutlined />}
          size="small"
          onClick={() => removeItem(row.key)}
          disabled={items.length === 1}
        />
      ),
    },
  ]

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16, gap: 12 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/imports')}>
          Quay lại
        </Button>
        <Title level={4} style={{ margin: 0 }}>
          📥 Tạo phiếu nhập kho
        </Title>
      </div>

      <Card>
        <Form form={form} layout="vertical">
          <Space wrap style={{ marginBottom: 0 }} size={16}>
            <Form.Item name="supplier_id" label="Nhà cung cấp" style={{ minWidth: 240 }}>
              <Select placeholder="Chọn nhà cung cấp" allowClear style={{ width: 240 }}>
                {suppliers.map((s) => (
                  <Option key={s.id} value={s.id}>{s.name}</Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item name="proposal_id" label="Liên kết đề xuất (không bắt buộc)" style={{ minWidth: 280 }}>
              <Select placeholder="Chọn đề xuất đã duyệt" allowClear style={{ width: 280 }}>
                {proposals.map((p) => (
                  <Option key={p.id} value={p.id}>[{p.code}] - {new Date(p.created_at).toLocaleDateString('vi-VN')}</Option>
                ))}
              </Select>
            </Form.Item>
          </Space>
          <Form.Item name="notes" label="Ghi chú">
            <Input.TextArea rows={2} placeholder="Nhập ghi chú (nếu có)" />
          </Form.Item>
        </Form>

        <Divider>Danh sách hàng hóa</Divider>

        <Table
          dataSource={items}
          columns={itemColumns}
          rowKey="key"
          pagination={false}
          size="small"
        />

        <Button
          type="dashed"
          icon={<PlusOutlined />}
          onClick={addItem}
          style={{ marginTop: 12, width: '100%' }}
        >
          Thêm mặt hàng
        </Button>

        <div style={{ marginTop: 24, display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 24 }}>
          <Statistic title="Tổng giá trị" value={totalAmount} formatter={(v) => fmtVND(Number(v))} valueStyle={{ color: '#1677ff', fontSize: 20 }} />
          <Space>
            <Button onClick={() => navigate('/imports')}>Hủy</Button>
            <Button
              type="primary"
              onClick={handleSubmit}
              loading={mutation.isPending}
              size="large"
            >
              Tạo phiếu nhập
            </Button>
          </Space>
        </div>
      </Card>
    </div>
  )
}
