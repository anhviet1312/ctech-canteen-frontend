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

  const { data: prodData } = useQuery({ queryKey: ['products'], queryFn: () => getProducts() })
  const products: Product[] = prodData?.data ?? []

  const addItem = () => {
    setItems((prev) => [
      ...prev,
      { key: Date.now().toString(), product_id: null, quantity: 1, max_qty: 999999 },
    ])
  }

  const removeItem = (key: string) => {
    setItems((prev) => prev.filter((i) => i.key !== key))
  }

  const updateItem = (key: string, updates: Partial<ExportItemRow>) => {
    setItems((prev) =>
      prev.map((i) => (i.key === key ? { ...i, ...updates } : i))
    )
  }

  // Helper kiểm tra mặt hàng đã được chọn ở dòng khác chưa
  const isSelectedInOtherRow = (productId: number, currentKey: string) => {
    return items.some((item) => item.key !== currentKey && item.product_id === productId)
  }

  // Tính tổng số lượng xuất theo từng product_id
  const totalQtyByProd = items.reduce<Record<number, number>>((acc, item) => {
    if (item.product_id != null) {
      acc[item.product_id] = (acc[item.product_id] || 0) + (Number(item.quantity) || 0)
    }
    return acc
  }, {})

  // Đếm số lần xuất hiện của từng product_id để phát hiện trùng lặp
  const productCounts = items.reduce<Record<number, number>>((acc, item) => {
    if (item.product_id != null) {
      acc[item.product_id] = (acc[item.product_id] || 0) + 1
    }
    return acc
  }, {})

  const duplicateProductIds = Object.keys(productCounts)
    .map(Number)
    .filter((id) => productCounts[id] > 1)
  const hasDuplicates = duplicateProductIds.length > 0

  // Kiểm tra mặt hàng nào có tổng số lượng vượt tồn kho khả dụng
  const exceededProducts = Object.entries(totalQtyByProd).filter(([prodId, totalQty]) => {
    const p = products.find((pr) => pr.id === Number(prodId))
    return p && totalQty > p.current_stock
  })
  const hasOverStockError = exceededProducts.length > 0

  const mutation = useMutation({
    mutationFn: createExport,
    onSuccess: () => {
      message.success('Tạo phiếu xuất thành công!')
      qc.invalidateQueries({ queryKey: ['exports'] })
      qc.invalidateQueries({ queryKey: ['inventory'] })
      qc.invalidateQueries({ queryKey: ['dashboard'] })
      navigate('/exports')
    },
    onError: (err: any) => {
      const msg = err.response?.data?.detail || 'Có lỗi xảy ra khi tạo phiếu xuất!'
      message.error(typeof msg === 'string' ? msg : JSON.stringify(msg))
    },
  })

  const handleSubmit = async () => {
    try {
      const vals = await form.validateFields()
      const validItems = items.filter((i) => i.product_id != null && Number(i.quantity) > 0)
      if (validItems.length === 0) {
        message.warning('Vui lòng thêm ít nhất một mặt hàng!')
        return
      }
      if (hasDuplicates) {
        message.error('Phát hiện mặt hàng bị chọn trùng lặp nhiều dòng. Vui lòng gộp số lượng vào 1 dòng!')
        return
      }
      if (hasOverStockError) {
        message.error('Tổng số lượng xuất của một số mặt hàng vượt quá tồn kho khả dụng!')
        return
      }
      mutation.mutate({
        ...vals,
        items: validItems.map((i) => ({ product_id: i.product_id, quantity: Number(i.quantity) })),
      })
    } catch (e) {
      // Form validation error
    }
  }

  const itemColumns = [
    {
      title: 'Hàng hóa (tồn kho hiện tại)',
      key: 'product',
      width: '50%',
      render: (_: any, row: ExportItemRow) => {
        const isDuplicated = row.product_id != null && duplicateProductIds.includes(row.product_id)
        return (
          <>
            <Select
              showSearch
              placeholder="Chọn hàng hóa"
              style={{ width: '100%' }}
              status={isDuplicated ? 'error' : ''}
              value={row.product_id ?? undefined}
              onChange={(v) => {
                const p = products.find((pr) => pr.id === v)
                const maxQ = p?.current_stock ?? 999999
                updateItem(row.key, {
                  product_id: v,
                  max_qty: maxQ,
                })
              }}
              filterOption={(input, option) =>
                String(option?.children ?? '').toLowerCase().includes(input.toLowerCase())
              }
            >
              {products.map((p) => {
                const isSelectedOther = isSelectedInOtherRow(p.id, row.key)
                return (
                  <Option key={p.id} value={p.id} disabled={isSelectedOther}>
                    [{p.code}] {p.name} — Tồn: {p.current_stock} {p.unit} {isSelectedOther ? '(Đã chọn ở dòng khác)' : ''}
                  </Option>
                )
              })}
            </Select>
            {isDuplicated && (
              <div style={{ color: '#ff4d4f', fontSize: 12, marginTop: 4 }}>
                ⚠️ Mặt hàng này đã được chọn ở dòng khác. Vui lòng xóa bớt hoặc gộp số lượng!
              </div>
            )}
          </>
        )
      },
    },
    {
      title: 'Số lượng',
      key: 'quantity',
      width: '25%',
      render: (_: any, row: ExportItemRow) => {
        const p = products.find((pr) => pr.id === row.product_id)
        const totalReq = row.product_id != null ? (totalQtyByProd[row.product_id] || 0) : 0
        const isExceeded = p ? totalReq > p.current_stock : false
        return (
          <>
            <InputNumber
              min={1}
              max={p?.current_stock ?? 999999}
              value={row.quantity}
              status={isExceeded ? 'error' : ''}
              onChange={(v) => {
                const qty = Number(v) || 1
                updateItem(row.key, { quantity: qty })
              }}
              style={{ width: '100%' }}
            />
            {isExceeded && p && (
              <div style={{ color: '#ff4d4f', fontSize: 12, marginTop: 4 }}>
                Tổng xuất ({totalReq} {p.unit}) vượt tồn kho ({p.current_stock} {p.unit})
              </div>
            )}
          </>
        )
      },
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

        {hasDuplicates && (
          <Alert
            message="Phát hiện mặt hàng trùng lặp: Mỗi mặt hàng chỉ được xuất hiện ở một dòng trong phiếu xuất. Vui lòng gộp số lượng hoặc xóa dòng trùng!"
            type="error"
            showIcon
            style={{ marginBottom: 12 }}
          />
        )}

        {hasOverStockError && (
          <Alert
            message="Tổng số lượng xuất của một số mặt hàng vượt quá tồn kho khả dụng hiện tại!"
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
            disabled={hasDuplicates || hasOverStockError}
            size="large"
          >
            Tạo phiếu xuất
          </Button>
        </div>
      </Card>
    </div>
  )
}
