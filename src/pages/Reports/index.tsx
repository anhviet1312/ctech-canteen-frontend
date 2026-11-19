import { useState } from 'react'
import { Tabs, Table, DatePicker, Space, Typography, Card, Statistic, Row, Col, Tag } from 'antd'
import { useQuery } from '@tanstack/react-query'
import { getImportReport, getExportReport, getInventorySummary } from '../../api/reports'
import dayjs from 'dayjs'

const { Title } = Typography
const { RangePicker } = DatePicker

const fmtVND = (val: number) => (val ?? 0).toLocaleString('vi-VN') + ' ₫'
const fmtDate = (d: string) => (d ? dayjs(d).format('DD/MM/YYYY HH:mm') : '—')

function ImportReportTab() {
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null]>([null, null])
  const params: any = {}
  if (dateRange[0]) params.date_from = dateRange[0].format('YYYY-MM-DD')
  if (dateRange[1]) params.date_to = dateRange[1].format('YYYY-MM-DD')

  const { data, isLoading } = useQuery({
    queryKey: ['report-imports', params],
    queryFn: () => getImportReport(params),
  })

  // Handle both { orders: [...] } and direct array response
  const rawData = data?.data
  const records: any[] = Array.isArray(rawData) ? rawData : (rawData?.orders ?? [])
  const totalValue = rawData?.grand_total_amount ?? records.reduce((s: number, r: any) => s + (r.total_amount ?? 0), 0)
  const totalCount = rawData?.total_orders ?? records.length

  const columns = [
    { title: 'Mã phiếu', dataIndex: 'code', key: 'code', width: 110 },
    {
      title: 'Nhà cung cấp',
      key: 'supplier',
      render: (_: any, r: any) => r.supplier?.name ?? r.supplier_name ?? '—',
    },
    { title: 'Ngày nhập', dataIndex: 'created_at', key: 'created_at', render: fmtDate, width: 160 },
    {
      title: 'Số mặt hàng',
      key: 'items',
      render: (_: any, r: any) => r.item_count ?? (Array.isArray(r.items) ? r.items.length : 0),
      width: 110,
    },
    {
      title: 'Tổng giá trị',
      dataIndex: 'total_amount',
      key: 'total_amount',
      render: (v: number) => <strong style={{ color: '#1677ff' }}>{fmtVND(v)}</strong>,
      width: 140,
    },
    {
      title: 'Người tạo',
      key: 'creator',
      render: (_: any, r: any) => r.creator?.full_name ?? r.creator_name ?? '—',
    },
    { title: 'Ghi chú', dataIndex: 'notes', key: 'notes', ellipsis: true },
  ]

  return (
    <div>
      <Space style={{ marginBottom: 16 }}>
        <RangePicker
          placeholder={['Từ ngày', 'Đến ngày']}
          format="DD/MM/YYYY"
          onChange={(dates) => setDateRange((dates as any) ?? [null, null])}
        />
      </Space>
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={8}>
          <Card>
            <Statistic title="Số phiếu nhập" value={totalCount} suffix="phiếu" />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="Tổng giá trị nhập"
              value={totalValue}
              formatter={(v) => fmtVND(Number(v))}
              valueStyle={{ color: '#1677ff' }}
            />
          </Card>
        </Col>
      </Row>
      <Table
        dataSource={records}
        columns={columns}
        rowKey="id"
        loading={isLoading}
        pagination={{ pageSize: 15 }}
        summary={() => (
          <Table.Summary>
            <Table.Summary.Row>
              <Table.Summary.Cell index={0} colSpan={4}>
                <strong>Tổng cộng</strong>
              </Table.Summary.Cell>
              <Table.Summary.Cell index={4}>
                <strong style={{ color: '#1677ff', fontSize: 15 }}>{fmtVND(totalValue)}</strong>
              </Table.Summary.Cell>
              <Table.Summary.Cell index={5} colSpan={2} />
            </Table.Summary.Row>
          </Table.Summary>
        )}
      />
    </div>
  )
}

function ExportReportTab() {
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null]>([null, null])
  const params: any = {}
  if (dateRange[0]) params.date_from = dateRange[0].format('YYYY-MM-DD')
  if (dateRange[1]) params.date_to = dateRange[1].format('YYYY-MM-DD')

  const { data, isLoading } = useQuery({
    queryKey: ['report-exports', params],
    queryFn: () => getExportReport(params),
  })

  // Handle both { products_summary: [...] } and direct array response
  const rawData = data?.data
  const records: any[] = Array.isArray(rawData) ? rawData : (rawData?.products_summary ?? [])
  const totalQty = records.reduce((s: number, r: any) => s + (r.total_quantity ?? 0), 0)
  const totalOrders = rawData?.total_orders ?? 0

  const columns = [
    { title: 'Mã hàng', dataIndex: 'product_code', key: 'product_code', width: 110 },
    { title: 'Tên hàng', dataIndex: 'product_name', key: 'product_name' },
    { title: 'Danh mục', dataIndex: 'category_name', key: 'category_name', render: (v: string) => v || '—' },
    { title: 'Đơn vị', dataIndex: 'unit', key: 'unit', width: 90 },
    {
      title: 'Tổng số lượng xuất',
      dataIndex: 'total_quantity',
      key: 'total_quantity',
      render: (v: number) => <span style={{ fontWeight: 600, color: '#ff4d4f' }}>{v}</span>,
      sorter: (a: any, b: any) => (a.total_quantity ?? 0) - (b.total_quantity ?? 0),
      defaultSortOrder: 'descend' as const,
      width: 170,
    },
    {
      title: 'Số lần xuất',
      dataIndex: 'export_count',
      key: 'export_count',
      render: (v: number, r: any) => v ?? r.order_count ?? 1,
      width: 120,
    },
  ]

  return (
    <div>
      <Space style={{ marginBottom: 16 }}>
        <RangePicker
          placeholder={['Từ ngày', 'Đến ngày']}
          format="DD/MM/YYYY"
          onChange={(dates) => setDateRange((dates as any) ?? [null, null])}
        />
      </Space>
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={8}>
          <Card>
            <Statistic title="Tổng số phiếu xuất" value={totalOrders} suffix="phiếu" />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="Tổng số lượng xuất"
              value={totalQty}
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic title="Số loại mặt hàng đã xuất" value={records.length} suffix="mặt hàng" />
          </Card>
        </Col>
      </Row>
      <Table
        dataSource={records}
        columns={columns}
        rowKey="product_id"
        loading={isLoading}
        pagination={{ pageSize: 20 }}
      />
    </div>
  )
}

function InventorySummaryTab() {
  const { data, isLoading } = useQuery({
    queryKey: ['report-inventory-summary'],
    queryFn: getInventorySummary,
  })

  // Handle both { items: [...] } and direct array response
  const rawData = data?.data
  const items: any[] = Array.isArray(rawData) ? rawData : (rawData?.items ?? [])
  const records: any[] = [...items].sort((a, b) => (b.stock_value ?? 0) - (a.stock_value ?? 0))
  const totalValue = rawData?.total_value ?? records.reduce((s: number, r: any) => s + (r.stock_value ?? 0), 0)
  const totalSku = rawData?.total_sku ?? records.length

  const columns = [
    { title: 'Mã', dataIndex: 'product_code', key: 'product_code', width: 100 },
    { title: 'Tên hàng', dataIndex: 'product_name', key: 'product_name' },
    { title: 'Danh mục', dataIndex: 'category_name', key: 'category_name', render: (v: string) => v || '—' },
    { title: 'Đơn vị', dataIndex: 'unit', key: 'unit', width: 80 },
    { title: 'Tồn kho', dataIndex: 'current_stock', key: 'current_stock', width: 90 },
    { title: 'Mức tối thiểu', dataIndex: 'min_quantity', key: 'min_quantity', width: 110 },
    { title: 'Đơn giá', dataIndex: 'price', key: 'price', render: (v: number) => fmtVND(v), width: 120 },
    {
      title: 'Giá trị tồn',
      dataIndex: 'stock_value',
      key: 'stock_value',
      render: (v: number) => <span style={{ fontWeight: 600 }}>{fmtVND(v)}</span>,
      width: 140,
    },
    {
      title: 'Trạng thái',
      key: 'status',
      width: 130,
      render: (_: any, r: any) =>
        r.current_stock < r.min_quantity ? (
          <Tag color="red">Dưới ngưỡng</Tag>
        ) : (
          <Tag color="green">Đủ hàng</Tag>
        ),
    },
  ]

  return (
    <div>
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={8}>
          <Card>
            <Statistic title="Tổng mặt hàng (SKU)" value={totalSku} suffix="SKU" />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="Tổng giá trị tồn kho"
              value={totalValue}
              formatter={(v) => fmtVND(Number(v))}
              valueStyle={{ color: '#1677ff' }}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="Hàng dưới ngưỡng tối thiểu"
              value={records.filter((r) => r.current_stock < r.min_quantity).length}
              valueStyle={{ color: '#ff4d4f' }}
              suffix="mặt hàng"
            />
          </Card>
        </Col>
      </Row>
      <Table
        dataSource={records}
        columns={columns}
        rowKey="id"
        loading={isLoading}
        pagination={{ pageSize: 20 }}
        scroll={{ x: 1000 }}
        summary={() => (
          <Table.Summary>
            <Table.Summary.Row>
              <Table.Summary.Cell index={0} colSpan={7}>
                <strong>Tổng giá trị</strong>
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

export default function ReportsPage() {
  const tabItems = [
    { key: 'imports', label: '📥 Báo cáo nhập kho', children: <ImportReportTab /> },
    { key: 'exports', label: '📤 Báo cáo xuất kho', children: <ExportReportTab /> },
    { key: 'inventory', label: '📊 Tổng quan tồn kho', children: <InventorySummaryTab /> },
  ]

  return (
    <div>
      <Title level={4} style={{ marginBottom: 16 }}>
        📈 Báo cáo thống kê
      </Title>
      <Tabs defaultActiveKey="imports" items={tabItems} />
    </div>
  )
}
