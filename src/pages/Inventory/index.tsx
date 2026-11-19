import { useState } from 'react'
import { Table, Typography, Tag, Input, Select, Alert, Statistic, Card, Row, Col } from 'antd'
import { WarningOutlined } from '@ant-design/icons'
import { useQuery } from '@tanstack/react-query'
import { getInventory, getAlerts } from '../../api/inventory'
import { getCategories } from '../../api/categories'
import { Category } from '../../types'

const { Title } = Typography
const { Option } = Select

const fmtVND = (val: number) => (val ?? 0).toLocaleString('vi-VN') + ' ₫'

export default function InventoryPage() {
  const [search, setSearch] = useState('')
  const [catFilter, setCatFilter] = useState<string | null>(null)

  const { data: invData, isLoading } = useQuery({
    queryKey: ['inventory'],
    queryFn: () => getInventory(),
  })

  const { data: alertsData } = useQuery({
    queryKey: ['inventory-alerts'],
    queryFn: getAlerts,
  })

  const { data: catData } = useQuery({
    queryKey: ['categories'],
    queryFn: getCategories,
  })

  const rawInventory = invData?.data
  const inventory: any[] = Array.isArray(rawInventory) ? rawInventory : []
  const alerts: any[] = Array.isArray(alertsData?.data) ? alertsData.data : []
  const categories: Category[] = Array.isArray(catData?.data) ? catData.data : []

  const filtered = inventory.filter((item: any) => {
    const code = String(item.code ?? item.product_code ?? '')
    const name = String(item.name ?? item.product_name ?? '')
    const cat = String(item.category_name ?? item.category?.name ?? '')

    const matchSearch =
      !search ||
      name.toLowerCase().includes(search.toLowerCase()) ||
      code.toLowerCase().includes(search.toLowerCase())

    const matchCat =
      !catFilter ||
      cat === catFilter ||
      String(item.category_id) === String(catFilter)

    return matchSearch && matchCat
  })

  const totalValue = filtered.reduce((s: number, i: any) => {
    const val = i.stock_value ?? (Number(i.current_stock ?? 0) * Number(i.price ?? 0))
    return s + val
  }, 0)

  const columns = [
    {
      title: 'Mã',
      key: 'code',
      width: 100,
      render: (_: any, r: any) => <span>{r.code ?? r.product_code ?? '—'}</span>,
    },
    {
      title: 'Tên hàng',
      key: 'name',
      render: (_: any, r: any) => <strong>{r.name ?? r.product_name ?? '—'}</strong>,
    },
    {
      title: 'Danh mục',
      key: 'category_name',
      render: (_: any, r: any) => r.category_name ?? r.category?.name ?? '—',
    },
    {
      title: 'Đơn vị',
      dataIndex: 'unit',
      key: 'unit',
      width: 80,
    },
    {
      title: 'Tồn kho hiện tại',
      key: 'current_stock',
      render: (_: any, r: any) => {
        const cur = Number(r.current_stock ?? 0)
        const min = Number(r.min_quantity ?? 0)
        return cur < min ? (
          <span style={{ color: '#ff4d4f', fontWeight: 700 }}>
            <WarningOutlined /> {cur}
          </span>
        ) : (
          <span style={{ color: '#52c41a', fontWeight: 700 }}>{cur}</span>
        )
      },
    },
    {
      title: 'Mức tối thiểu',
      dataIndex: 'min_quantity',
      key: 'min_quantity',
    },
    {
      title: 'Đơn giá',
      dataIndex: 'price',
      key: 'price',
      render: (v: number) => fmtVND(v),
    },
    {
      title: 'Giá trị tồn',
      key: 'stock_value',
      render: (_: any, r: any) => {
        const val = r.stock_value ?? (Number(r.current_stock ?? 0) * Number(r.price ?? 0))
        return <strong style={{ color: '#1677ff' }}>{fmtVND(val)}</strong>
      },
    },
    {
      title: 'Trạng thái',
      key: 'status',
      render: (_: any, r: any) => {
        const cur = Number(r.current_stock ?? 0)
        const min = Number(r.min_quantity ?? 0)
        return cur < min ? (
          <Tag color="red">Dưới ngưỡng</Tag>
        ) : (
          <Tag color="green">Đủ hàng</Tag>
        )
      },
    },
  ]

  return (
    <div>
      <Title level={4} style={{ marginBottom: 16 }}>
        📋 Tồn kho hiện tại
      </Title>

      {alerts.length > 0 && (
        <Alert
          message={`⚠️ Có ${alerts.length} mặt hàng dưới ngưỡng tồn kho tối thiểu cần nhập bổ sung!`}
          type="warning"
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}

      <Row gutter={16} style={{ marginBottom: 16 }}>
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
              <Option key={c.id} value={c.name}>
                {c.name}
              </Option>
            ))}
          </Select>
        </Col>
      </Row>

      <Table
        dataSource={filtered}
        columns={columns}
        rowKey={(r: any) => r.id ?? r.product_id ?? r.code}
        loading={isLoading}
        pagination={{ pageSize: 20 }}
        scroll={{ x: 1000 }}
        summary={() => (
          <Table.Summary>
            <Table.Summary.Row style={{ background: '#fafafa' }}>
              <Table.Summary.Cell index={0} colSpan={7}>
                <strong>Tổng giá trị tồn kho ({filtered.length} mặt hàng)</strong>
              </Table.Summary.Cell>
              <Table.Summary.Cell index={7}>
                <strong style={{ color: '#1677ff', fontSize: 15 }}>{fmtVND(totalValue)}</strong>
              </Table.Summary.Cell>
              <Table.Summary.Cell index={8} />
            </Table.Summary.Row>
          </Table.Summary>
        )}
      />
    </div>
  )
}
