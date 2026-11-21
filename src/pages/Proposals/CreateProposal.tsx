import { useState } from 'react'
import {
  Button, Typography, Card, Table, Tag, Checkbox, Input, Alert, Space, message, Spin,
} from 'antd'
import { RobotOutlined, ArrowLeftOutlined, SendOutlined } from '@ant-design/icons'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { aiAnalyze, createProposal } from '../../api/proposals'
import { AISuggestion } from '../../types'

const { Title, Text } = Typography

const PRIORITY_MAP: Record<string, { label: string; color: string }> = {
  HIGH: { label: '🔴 Khẩn cấp', color: 'red' },
  MEDIUM: { label: '🟠 Trung bình', color: 'orange' },
  LOW: { label: '🟢 Thấp', color: 'green' },
}

export default function CreateProposalPage() {
  const navigate = useNavigate()
  const qc = useQueryClient()

  const [suggestions, setSuggestions] = useState<AISuggestion[]>([])
  const [analyzed, setAnalyzed] = useState(false)
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [notes, setNotes] = useState('')

  const analyzeMut = useMutation({
    mutationFn: aiAnalyze,
    onSuccess: (res) => {
      const data: AISuggestion[] = res.data ?? []
      setSuggestions(data)
      setAnalyzed(true)
      setSelected(new Set(data.map((s) => s.product_id)))
    },
    onError: () => message.error('Có lỗi khi phân tích tồn kho!'),
  })

  const createMut = useMutation({
    mutationFn: createProposal,
    onSuccess: (res) => {
      message.success('Tạo đề xuất nhập hàng thành công!')
      qc.invalidateQueries({ queryKey: ['proposals'] })
      navigate(`/proposals/${res.data.id}`)
    },
    onError: () => message.error('Có lỗi khi tạo đề xuất!'),
  })

  const toggleSelect = (productId: number) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(productId)) {
        next.delete(productId)
      } else {
        next.add(productId)
      }
      return next
    })
  }

  const handleCreate = () => {
    const selectedItems = suggestions.filter((s) => selected.has(s.product_id))
    createMut.mutate({
      ai_generated: true,
      notes,
      items: selectedItems.map((s) => ({
        product_id: s.product_id,
        current_stock: s.current_stock,
        suggested_quantity: s.suggested_quantity,
        reason: s.reason,
        priority: s.priority,
        daily_consumption: s.daily_consumption,
      })),
    })
  }

  const columns = [
    {
      title: 'Chọn',
      key: 'select',
      width: 60,
      render: (_: any, row: AISuggestion) => (
        <Checkbox
          checked={selected.has(row.product_id)}
          onChange={() => toggleSelect(row.product_id)}
        />
      ),
    },
    { title: 'Tên hàng', dataIndex: 'product_name', key: 'product_name' },
    { title: 'Mã', dataIndex: 'product_code', key: 'product_code', width: 100 },
    { title: 'Đơn vị', dataIndex: 'unit', key: 'unit', width: 80 },
    {
      title: 'Tồn kho',
      dataIndex: 'current_stock',
      key: 'current_stock',
      render: (v: number) => <span style={{ color: '#ff4d4f', fontWeight: 600 }}>{v}</span>,
    },
    {
      title: 'Tiêu thụ TB/ngày',
      dataIndex: 'daily_consumption',
      key: 'daily_consumption',
      render: (v: number) => v?.toFixed(1),
    },
    {
      title: 'Đề xuất nhập',
      dataIndex: 'suggested_quantity',
      key: 'suggested_quantity',
      render: (v: number) => <span style={{ color: '#1677ff', fontWeight: 600 }}>{v}</span>,
    },
    {
      title: 'Mức ưu tiên',
      dataIndex: 'priority',
      key: 'priority',
      render: (v: string) => {
        const p = PRIORITY_MAP[v] ?? { label: v, color: 'default' }
        return <Tag color={p.color}>{p.label}</Tag>
      },
    },
    { title: 'Lý do', dataIndex: 'reason', key: 'reason' },
  ]

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16, gap: 12 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/proposals')}>
          Quay lại
        </Button>
        <Title level={4} style={{ margin: 0 }}>
          🤖 Phân Tích Tồn Kho & Tạo Đề Xuất Nhập Hàng
        </Title>
      </div>

      <Card style={{ marginBottom: 16 }}>
        <Space direction="vertical" style={{ width: '100%' }}>
          <Text type="secondary">
            Hệ thống sẽ phân tích tồn kho hiện tại, lịch sử tiêu thụ và tự động gợi ý các mặt hàng cần nhập bổ sung.
          </Text>
          <Button
            type="primary"
            icon={analyzeMut.isPending ? <Spin size="small" /> : <RobotOutlined />}
            onClick={() => analyzeMut.mutate()}
            loading={analyzeMut.isPending}
            size="large"
          >
            🤖 Phân tích AI
          </Button>
        </Space>
      </Card>

      {analyzed && (
        <>
          {suggestions.length === 0 ? (
            <Alert
              message="✅ Không có mặt hàng nào cần nhập bổ sung"
              description="Tất cả mặt hàng đang ở mức tồn kho an toàn."
              type="info"
              showIcon
            />
          ) : (
            <Card
              title={
                <Space>
                  <span>Kết quả phân tích AI</span>
                  <Tag color="purple">{suggestions.length} mặt hàng cần nhập</Tag>
                  <Tag color="blue">{selected.size} đã chọn</Tag>
                </Space>
              }
            >
              <Table
                dataSource={suggestions}
                columns={columns}
                rowKey="product_id"
                pagination={false}
                size="small"
                rowClassName={(row) =>
                  !selected.has(row.product_id) ? 'ant-table-row-disabled' : ''
                }
              />

              <div style={{ marginTop: 16 }}>
                <Text strong>Ghi chú đề xuất:</Text>
                <Input.TextArea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Nhập ghi chú (nếu có)..."
                  style={{ marginTop: 8 }}
                />
              </div>

              <div style={{ marginTop: 16, display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                <Button onClick={() => navigate('/proposals')}>Hủy</Button>
                <Button
                  type="primary"
                  icon={<SendOutlined />}
                  disabled={selected.size === 0}
                  onClick={handleCreate}
                  loading={createMut.isPending}
                  size="large"
                >
                  Tạo đề xuất nhập hàng ({selected.size} mặt hàng)
                </Button>
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  )
}
