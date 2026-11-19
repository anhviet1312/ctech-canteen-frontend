import { Row, Col, Card, Statistic, Alert, Table, Button, Typography, Spin, Tag } from 'antd'
import {
  AppstoreOutlined,
  WarningOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  ClockCircleOutlined,
  DollarOutlined,
} from '@ant-design/icons'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { getDashboard, getAlerts } from '../../api/inventory'
import { DashboardSummary, Product } from '../../types'

const { Title } = Typography

const fmtVND = (val: number) => val?.toLocaleString('vi-VN') + ' ₫'

export default function DashboardPage() {
  const navigate = useNavigate()

  const { data: dashData, isLoading: dashLoading } = useQuery<{ data: DashboardSummary }>({
    queryKey: ['dashboard'],
    queryFn: getDashboard,
  })

  const { data: alertsData, isLoading: alertsLoading } = useQuery<{ data: Product[] }>({
    queryKey: ['inventory-alerts'],
    queryFn: getAlerts,
  })

  const summary = dashData?.data
  const alerts = alertsData?.data ?? []

  const alertColumns = [
    { title: 'Mã', dataIndex: 'code', key: 'code', width: 100 },
    { title: 'Tên hàng', dataIndex: 'name', key: 'name' },
    {
      title: 'Danh mục',
      key: 'category',
      render: (_: any, r: Product) => r.category?.name ?? '—',
    },
    {
      title: 'Tồn kho',
      dataIndex: 'current_stock',
      key: 'current_stock',
      render: (val: number) => <span style={{ color: '#ff4d4f', fontWeight: 600 }}>{val}</span>,
    },
    {
      title: 'Mức tối thiểu',
      dataIndex: 'min_quantity',
      key: 'min_quantity',
    },
    { title: 'Đơn vị', dataIndex: 'unit', key: 'unit' },
    {
      title: 'Hành động',
      key: 'action',
      render: (_: any, r: Product) => (
        <Button size="small" onClick={() => navigate('/inventory')}>
          Xem chi tiết
        </Button>
      ),
    },
  ]

  if (dashLoading) {
    return (
      <div style={{ textAlign: 'center', paddingTop: 80 }}>
        <Spin size="large" />
      </div>
    )
  }

  return (
    <div>
      <Title level={4} style={{ marginBottom: 20 }}>
        📊 Tổng quan hệ thống
      </Title>

      {(summary?.low_stock_count ?? 0) > 0 && (
        <Alert
          message={`⚠️ Có ${summary?.low_stock_count} mặt hàng dưới ngưỡng tồn kho tối thiểu!`}
          type="warning"
          showIcon
          style={{ marginBottom: 20 }}
          action={
            <Button size="small" onClick={() => navigate('/inventory')}>
              Xem chi tiết
            </Button>
          }
        />
      )}

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={8}>
          <Card>
            <Statistic
              title="Tổng mặt hàng"
              value={summary?.total_products ?? 0}
              prefix={<AppstoreOutlined style={{ color: '#1677ff' }} />}
              valueStyle={{ color: '#1677ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <Card>
            <Statistic
              title="Giá trị tồn kho"
              value={summary?.total_stock_value ?? 0}
              formatter={(val) => fmtVND(Number(val))}
              prefix={<DollarOutlined style={{ color: '#52c41a' }} />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <Card>
            <Statistic
              title="Hàng dưới ngưỡng"
              value={summary?.low_stock_count ?? 0}
              prefix={<WarningOutlined style={{ color: summary?.low_stock_count ? '#ff4d4f' : '#8c8c8c' }} />}
              valueStyle={{ color: summary?.low_stock_count ? '#ff4d4f' : '#8c8c8c' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <Card>
            <Statistic
              title="Đề xuất chờ duyệt"
              value={summary?.pending_proposals ?? 0}
              prefix={<ClockCircleOutlined style={{ color: '#faad14' }} />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <Card>
            <Statistic
              title="Nhập kho hôm nay"
              value={summary?.today_imports ?? 0}
              prefix={<ArrowUpOutlined style={{ color: '#52c41a' }} />}
              valueStyle={{ color: '#52c41a' }}
              suffix="phiếu"
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <Card>
            <Statistic
              title="Xuất kho hôm nay"
              value={summary?.today_exports ?? 0}
              prefix={<ArrowDownOutlined style={{ color: '#ff4d4f' }} />}
              valueStyle={{ color: '#ff4d4f' }}
              suffix="phiếu"
            />
          </Card>
        </Col>
      </Row>

      {alerts.length > 0 && (
        <Card
          title={
            <span>
              <WarningOutlined style={{ color: '#faad14', marginRight: 8 }} />
              Danh sách hàng hóa cần nhập bổ sung
            </span>
          }
          extra={
            <Button type="primary" size="small" onClick={() => navigate('/proposals/create')}>
              🤖 Tạo đề xuất AI
            </Button>
          }
        >
          <Table
            dataSource={alerts}
            columns={alertColumns}
            rowKey="id"
            loading={alertsLoading}
            size="small"
            pagination={{ pageSize: 10 }}
          />
        </Card>
      )}
    </div>
  )
}
