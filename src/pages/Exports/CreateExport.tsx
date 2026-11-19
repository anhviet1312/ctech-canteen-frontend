import { useState } from 'react'
import {
  Form, Input, Select, Button, Typography, Card, Table, InputNumber,
  Space, Divider, message, Alert,
} from 'antd'
import { PlusOutlined, DeleteOutlined, ArrowLeftOutlined } from '@ant-design/icons'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { createExport } from '../../api/exports'
import { getProducts } from '../../api/products'
import { Product } from '../../types'

const { Title } = Typography
const { Option } = Select

interface ExportItemRow {
  key: string
  product_id: number | null
  quantity: number
  max_qty: number
}

export default function CreateExportPage() {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [form] = Form.useForm()
  const [items, setItems] = useState<ExportItemRow[]>([
    { key: '1', product_id: null, quantity: 1, max_qty: 999999 },
  ])
  const [qtyErrors, setQtyErrors] = useState<Record<string, boolean>>({})

  const { data: prodData } = useQuery({ queryKey: ['products'], queryFn: () => getProducts() })
  const products: Product[] = prodData?.data ?? []

  const addItem = () => {
    setItems([...items, { key: Date.now().toString(), product_id: null, quantity: 1, max_qty: 999999 }])
  }

  const removeItem = (key: string) => {
    setItems(items.filter((i) => i.key !== key))
    setQtyErrors((prev) => { const copy = { ...prev }; delete copy[key]; return copy })
  }

  const updateItem = (key: string, field: keyof ExportItemRow, value: any) => {
    setItems((prev) => prev.map((i) => (i.key === key ? { ...i, [field]: value } : i)))
  }

  const mutation = useMutation({
    mutationFn: createExport,
    onSuccess: () => {
      message.success('Tạo phiếu xuất thành công!')
      qc.invalidateQueries({ queryKey: ['exports'] })
      navigate('/exports')
    },
    onError: () => message.error('Có lỗi xảy ra khi tạo phiếu xuất!'),
  })

  const hasQtyError = Object.values(qtyErrors).some(Boolean)

  const handleSubmit = async () => {
    const vals = await form.validateFields()
    const validItems = items.filter((i) => i.product_id && i.quantity > 0)
    if (validItems.length === 0) {
      message.warning('Vui lòng thêm ít nhất một mặt hàng!')
      return
    }
    if (hasQtyError) {
      message.warning('Số lượng xuất vượt quá tồn kho!')
      return
    }
    mutation.mutate({
      ...vals,
      items: validItems.map((i) => ({ product_id: i.product_id, quantity: i.quantity })),
    })
  }

  const itemColumns = [
    {
      title: 'Hàng hóa (tồn kho hiện tại)',
      key: 'product',
      width: '45%',
      render: (_: any, row: ExportItemRow) => (
        <Select
          showSearch
          placeholder="Chọn hàng hóa"
          style={{ width: '100%' }}
          value={row.product_id ?? undefined}
          onChange={(v) => {
            const p = products.find((pr) => pr.id === v)
            updateItem(row.key, 'product_id', v)
            updateItem(row.key, 'max_qty', p?.current_stock ?? 999999)
            setQtyErrors((prev) => ({ ...prev, [row.key]: row.quantity > (p?.current_stock ?? 999999) }))
          }}
          filterOption={(input, option) =>
            String(option?.children ?? '').toLowerCase().includes(input.toLowerCase())
          }
        >
          {products.map((p) => (
            <Option key={p.id} value={p.id}>
              [{p.code}] {p.name} — Tồn: {p.current_stock} {p.unit}
            </Option>
          ))}
        </Select>
      ),
    },
    {
      title: 'Số lượng',
      key: 'quantity',
      width: '25%',
      render: (_: any, row: ExportItemRow) => (
        <>
          <InputNumber
            min={1}
            max={row.max_qty}
            value={row.quantity}
            status={qtyErrors[row.key] ? 'error' : ''}
            onChange={(v) => {
              const qty = v ?? 1
              updateItem(row.key, 'quantity', qty)
              setQtyErrors((prev) => ({ ...prev, [row.key]: qty > row.max_qty }))
            }}
            style={{ width: '100%' }}
          />
          {qtyErrors[row.key] && (
            <div style={{ color: '#ff4d4f', fontSize: 12 }}>Vượt quá tồn kho ({row.max_qty})</div>
          )}
        </>
      ),
    },
    {
      title: '',
      key: 'del',
      width: 50,
      render: (_: any, row: ExportItemRow) => (
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
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/exports')}>
          Quay lại
        </Button>
        <Title level={4} style={{ margin: 0 }}>
          📤 Tạo phiếu xuất kho
        </Title>
      </div>

      <Card>
        <Form form={form} layout="vertical">
          <Space wrap size={16}>
            <Form.Item
              name="reason"
              label="Lý do xuất"
              rules={[{ required: true, message: 'Vui lòng chọn lý do xuất!' }]}
              style={{ minWidth: 200 }}
            >
              <Select placeholder="Chọn lý do" style={{ width: 200 }}>
                <Option value="Tiêu thụ">Tiêu thụ</Option>
                <Option value="Hư hỏng">Hư hỏng</Option>
                <Option value="Hết hạn">Hết hạn</Option>
                <Option value="Khác">Khác</Option>
              </Select>
            </Form.Item>
          </Space>
          <Form.Item name="notes" label="Ghi chú">
            <Input.TextArea rows={2} placeholder="Nhập ghi chú (nếu có)" />
          </Form.Item>
        </Form>

        <Divider>Danh sách hàng hóa xuất kho</Divider>

        {hasQtyError && (
          <Alert
            message="Có mặt hàng có số lượng xuất vượt quá tồn kho!"
            type="error"
            showIcon
            style={{ marginBottom: 12 }}
          />
        )}

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

        <div style={{ marginTop: 24, display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
          <Button onClick={() => navigate('/exports')}>Hủy</Button>
          <Button
            type="primary"
            onClick={handleSubmit}
            loading={mutation.isPending}
            size="large"
          >
            Tạo phiếu xuất
          </Button>
        </div>
      </Card>
    </div>
  )
}
