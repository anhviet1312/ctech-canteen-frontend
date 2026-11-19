import { useState } from 'react'
import { Table, Button, Typography, Tag, Tabs } from 'antd'
import { PlusOutlined, EyeOutlined } from '@ant-design/icons'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { getProposals } from '../../api/proposals'
import { Proposal } from '../../types'
import dayjs from 'dayjs'

const { Title } = Typography

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  PENDING: { label: 'Chờ duyệt', color: 'orange' },
  APPROVED: { label: 'Đã duyệt', color: 'blue' },
  REJECTED: { label: 'Từ chối', color: 'red' },
  IN_PROGRESS: { label: 'Đang thực hiện', color: 'purple' },
  COMPLETED: { label: 'Hoàn thành', color: 'green' },
  CANCELLED: { label: 'Đã hủy', color: 'default' },
}

const fmtDate = (d: string) => (d ? dayjs(d).format('DD/MM/YYYY HH:mm') : '—')

export default function ProposalsPage() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('all')

  const params: any = {}
  if (activeTab !== 'all') params.status = activeTab

  const { data, isLoading } = useQuery({
    queryKey: ['proposals', params],
    queryFn: () => getProposals(params),
  })

  const proposals: Proposal[] = data?.data ?? []

  const columns = [
    { title: 'Mã', dataIndex: 'code', key: 'code', width: 130 },
    { title: 'Ngày tạo', dataIndex: 'created_at', key: 'created_at', render: fmtDate },
    {
      title: 'Người tạo',
      key: 'creator',
      render: (_: any, r: Proposal) => r.creator?.full_name ?? '—',
    },
    {
      title: 'Nguồn',
      dataIndex: 'ai_generated',
      key: 'ai_generated',
      render: (v: boolean) => (
        <Tag color={v ? 'purple' : 'blue'}>{v ? '🤖 AI' : '👤 Thủ công'}</Tag>
      ),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (v: string) => {
        const s = STATUS_LABELS[v] ?? { label: v, color: 'default' }
        return <Tag color={s.color}>{s.label}</Tag>
      },
    },
    {
      title: 'Số mặt hàng',
      key: 'items',
      render: (_: any, r: Proposal) => r.items?.length ?? 0,
    },
    {
      title: 'Hành động',
      key: 'action',
      render: (_: any, record: Proposal) => (
        <Button
          icon={<EyeOutlined />}
          size="small"
          onClick={() => navigate(`/proposals/${record.id}`)}
        >
          Xem chi tiết
        </Button>
      ),
    },
  ]

  const tabItems = [
    { key: 'all', label: 'Tất cả' },
    { key: 'PENDING', label: '⏳ Chờ duyệt' },
    { key: 'APPROVED', label: '✅ Đã duyệt' },
    { key: 'REJECTED', label: '❌ Từ chối' },
    { key: 'IN_PROGRESS', label: '🔄 Đang thực hiện' },
    { key: 'COMPLETED', label: '🎉 Hoàn thành' },
    { key: 'CANCELLED', label: '🚫 Đã hủy' },
  ]

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <Title level={4} style={{ margin: 0 }}>
          🤖 Đề xuất nhập hàng
        </Title>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => navigate('/proposals/create')}
        >
          Phân tích AI & Tạo đề xuất
        </Button>
      </div>

      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={tabItems}
        style={{ marginBottom: 0 }}
      />

      <Table
        dataSource={proposals}
        columns={columns}
        rowKey="id"
        loading={isLoading}
        pagination={{ pageSize: 15 }}
      />
    </div>
  )
}
