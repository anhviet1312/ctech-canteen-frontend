import { useState } from 'react'
import {
  Button, Typography, Card, Table, Tag, Timeline, Descriptions, Modal, Input,
  Space, message, Spin, Alert, Divider,
} from 'antd'
import {
  ArrowLeftOutlined, CheckOutlined, CloseOutlined, PlayCircleOutlined,
  CheckCircleOutlined, StopOutlined,
} from '@ant-design/icons'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate, useParams } from 'react-router-dom'
import {
  getProposalDetail, approveProposal, rejectProposal, startProposal,
  completeProposal, cancelProposal,
} from '../../api/proposals'
import { useAuthStore } from '../../store/authStore'
import { Proposal, ProposalItem, ProposalLog } from '../../types'
import dayjs from 'dayjs'

const { Title, Text } = Typography

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  PENDING: { label: 'Chờ duyệt', color: 'orange' },
  APPROVED: { label: 'Đã duyệt', color: 'blue' },
  REJECTED: { label: 'Từ chối', color: 'red' },
  IN_PROGRESS: { label: 'Đang thực hiện', color: 'purple' },
  COMPLETED: { label: 'Hoàn thành', color: 'green' },
  CANCELLED: { label: 'Đã hủy', color: 'default' },
}

const ACTION_LABELS: Record<string, string> = {
  CREATED: 'Tạo đề xuất',
  APPROVED: 'Phê duyệt',
  REJECTED: 'Từ chối',
  IN_PROGRESS: 'Bắt đầu thực hiện',
  COMPLETED: 'Hoàn thành',
  CANCELLED: 'Đã hủy',
  STARTED: 'Bắt đầu thực hiện',
}

const PRIORITY_MAP: Record<string, { label: string; color: string }> = {
  HIGH: { label: 'Khẩn cấp', color: 'red' },
  MEDIUM: { label: 'Trung bình', color: 'orange' },
  LOW: { label: 'Thấp', color: 'green' },
}

const fmtDate = (d: string) => (d ? dayjs(d).format('DD/MM/YYYY HH:mm') : '—')

export default function ProposalDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const user = useAuthStore((s) => s.user)
  const isManager = user?.role === 'manager'

  const [approveModal, setApproveModal] = useState(false)
  const [rejectModal, setRejectModal] = useState(false)
  const [cancelModal, setCancelModal] = useState(false)
  const [comment, setComment] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['proposal', id],
    queryFn: () => getProposalDetail(Number(id)),
    enabled: !!id,
  })

  const proposal: Proposal | null = data?.data ?? null

  const approveMut = useMutation({
    mutationFn: (data: any) => approveProposal(Number(id), data),
    onSuccess: () => {
      message.success('Đã phê duyệt đề xuất!')
      qc.invalidateQueries({ queryKey: ['proposal', id] })
      qc.invalidateQueries({ queryKey: ['proposals'] })
      setApproveModal(false)
      setComment('')
    },
    onError: () => message.error('Có lỗi xảy ra!'),
  })

  const rejectMut = useMutation({
    mutationFn: (data: any) => rejectProposal(Number(id), data),
    onSuccess: () => {
      message.success('Đã từ chối đề xuất!')
      qc.invalidateQueries({ queryKey: ['proposal', id] })
      qc.invalidateQueries({ queryKey: ['proposals'] })
      setRejectModal(false)
      setComment('')
    },
    onError: () => message.error('Có lỗi xảy ra!'),
  })

  const startMut = useMutation({
    mutationFn: () => startProposal(Number(id)),
    onSuccess: () => {
      message.success('Đã bắt đầu thực hiện!')
      qc.invalidateQueries({ queryKey: ['proposal', id] })
      qc.invalidateQueries({ queryKey: ['proposals'] })
    },
    onError: () => message.error('Có lỗi xảy ra!'),
  })

  const completeMut = useMutation({
    mutationFn: () => completeProposal(Number(id)),
    onSuccess: () => {
      message.success('Đã hoàn thành đề xuất!')
      qc.invalidateQueries({ queryKey: ['proposal', id] })
      qc.invalidateQueries({ queryKey: ['proposals'] })
    },
    onError: () => message.error('Có lỗi xảy ra!'),
  })

  const cancelMut = useMutation({
    mutationFn: (data: any) => cancelProposal(Number(id), data),
    onSuccess: () => {
      message.success('Đã hủy đề xuất!')
      qc.invalidateQueries({ queryKey: ['proposal', id] })
      qc.invalidateQueries({ queryKey: ['proposals'] })
      setCancelModal(false)
      setComment('')
    },
    onError: () => message.error('Có lỗi xảy ra!'),
  })

  if (isLoading) {
    return (
      <div style={{ textAlign: 'center', paddingTop: 80 }}>
        <Spin size="large" />
      </div>
    )
  }

  if (!proposal) return <Alert message="Không tìm thấy đề xuất!" type="error" />

  const status = STATUS_LABELS[proposal.status] ?? { label: proposal.status, color: 'default' }

  const itemColumns = [
    { title: 'Tên hàng', key: 'name', render: (_: any, r: ProposalItem) => r.product?.name ?? r.product_id },
    { title: 'Mã', key: 'code', render: (_: any, r: ProposalItem) => r.product?.code ?? '—' },
    { title: 'Đơn vị', key: 'unit', render: (_: any, r: ProposalItem) => r.product?.unit ?? '—' },
    { title: 'Tồn kho', dataIndex: 'current_stock', key: 'current_stock', render: (v: number) => <span style={{ color: '#ff4d4f' }}>{v}</span> },
    { title: 'Đề xuất nhập', dataIndex: 'suggested_quantity', key: 'suggested_quantity', render: (v: number) => <span style={{ color: '#1677ff', fontWeight: 600 }}>{v}</span> },
    { title: 'Tiêu thụ TB/ngày', dataIndex: 'daily_consumption', key: 'daily_consumption', render: (v: number) => v?.toFixed?.(1) ?? v },
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
          Chi tiết đề xuất nhập hàng
        </Title>
      </div>

      {/* Header Card */}
      <Card style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <Descriptions column={2} size="small">
              <Descriptions.Item label="Mã đề xuất">
                <Text strong style={{ fontSize: 15 }}>{proposal.code}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="Trạng thái">
                <Tag color={status.color} style={{ fontSize: 13, padding: '2px 10px' }}>{status.label}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Ngày tạo">{fmtDate(proposal.created_at)}</Descriptions.Item>
              <Descriptions.Item label="Người tạo">{proposal.creator?.full_name ?? '—'}</Descriptions.Item>
              <Descriptions.Item label="Nguồn">
                <Tag color={proposal.ai_generated ? 'purple' : 'blue'}>
                  {proposal.ai_generated ? '🤖 AI' : '👤 Thủ công'}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Số mặt hàng">{proposal.items?.length ?? 0}</Descriptions.Item>
              {proposal.notes && (
                <Descriptions.Item label="Ghi chú" span={2}>{proposal.notes}</Descriptions.Item>
              )}
              {proposal.reviewer && (
                <>
                  <Descriptions.Item label="Người duyệt">{proposal.reviewer.full_name}</Descriptions.Item>
                  <Descriptions.Item label="Ngày duyệt">{fmtDate(proposal.reviewed_at ?? '')}</Descriptions.Item>
                  {proposal.review_comment && (
                    <Descriptions.Item label="Nhận xét" span={2}>{proposal.review_comment}</Descriptions.Item>
                  )}
                </>
              )}
            </Descriptions>
          </div>

          {/* Action Buttons */}
          <Space wrap>
            {proposal.status === 'PENDING' && isManager && (
              <>
                <Button
                  type="primary"
                  icon={<CheckOutlined />}
                  onClick={() => setApproveModal(true)}
                  style={{ background: '#52c41a', borderColor: '#52c41a' }}
                >
                  Phê duyệt
                </Button>
                <Button
                  danger
                  icon={<CloseOutlined />}
                  onClick={() => setRejectModal(true)}
                >
                  Từ chối
                </Button>
              </>
            )}
            {proposal.status === 'APPROVED' && !isManager && (
              <Button
                type="primary"
                icon={<PlayCircleOutlined />}
                onClick={() => startMut.mutate()}
                loading={startMut.isPending}
              >
                Bắt đầu thực hiện
              </Button>
            )}
            {proposal.status === 'APPROVED' && isManager && (
              <Button
                danger
                icon={<StopOutlined />}
                onClick={() => setCancelModal(true)}
              >
                Hủy đề xuất
              </Button>
            )}
            {proposal.status === 'IN_PROGRESS' && !isManager && (
              <Button
                type="primary"
                icon={<CheckCircleOutlined />}
                onClick={() => completeMut.mutate()}
                loading={completeMut.isPending}
                style={{ background: '#52c41a', borderColor: '#52c41a' }}
              >
                Hoàn thành nhập hàng
              </Button>
            )}
          </Space>
        </div>
      </Card>

      {/* Items Table */}
      <Card title="Danh sách mặt hàng đề xuất" style={{ marginBottom: 16 }}>
        <Table
          dataSource={proposal.items}
          columns={itemColumns}
          rowKey="id"
          pagination={false}
          size="small"
          scroll={{ x: 900 }}
        />
      </Card>

      {/* Workflow History */}
      {proposal.logs && proposal.logs.length > 0 && (
        <Card title="📜 Lịch sử xử lý">
          <Timeline
            items={proposal.logs.map((log: ProposalLog) => ({
              key: log.id,
              color: log.action === 'REJECTED' || log.action === 'CANCELLED' ? 'red' : log.action === 'COMPLETED' ? 'green' : 'blue',
              children: (
                <div>
                  <div>
                    <Text strong>{ACTION_LABELS[log.action] ?? log.action}</Text>
                    {' — '}
                    <Text type="secondary">{log.actor?.full_name ?? '—'}</Text>
                  </div>
                  <div style={{ color: '#8c8c8c', fontSize: 12 }}>{fmtDate(log.created_at)}</div>
                  {log.comment && <div style={{ marginTop: 4, color: '#595959' }}>💬 {log.comment}</div>}
                </div>
              ),
            }))}
          />
        </Card>
      )}

      {/* Approve Modal */}
      <Modal
        title="Phê duyệt đề xuất"
        open={approveModal}
        onOk={() => approveMut.mutate({ comment })}
        onCancel={() => { setApproveModal(false); setComment('') }}
        confirmLoading={approveMut.isPending}
        okText="Phê duyệt"
        cancelText="Hủy"
        okButtonProps={{ style: { background: '#52c41a', borderColor: '#52c41a' } }}
      >
        <Input.TextArea
          rows={3}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Nhập nhận xét (tùy chọn)..."
        />
      </Modal>

      {/* Reject Modal */}
      <Modal
        title="Từ chối đề xuất"
        open={rejectModal}
        onOk={() => rejectMut.mutate({ comment })}
        onCancel={() => { setRejectModal(false); setComment('') }}
        confirmLoading={rejectMut.isPending}
        okText="Từ chối"
        cancelText="Hủy"
        okButtonProps={{ danger: true }}
      >
        <Input.TextArea
          rows={3}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Nhập lý do từ chối..."
        />
      </Modal>

      {/* Cancel Modal */}
      <Modal
        title="Hủy đề xuất"
        open={cancelModal}
        onOk={() => cancelMut.mutate({ comment })}
        onCancel={() => { setCancelModal(false); setComment('') }}
        confirmLoading={cancelMut.isPending}
        okText="Hủy đề xuất"
        cancelText="Đóng"
        okButtonProps={{ danger: true }}
      >
        <Input.TextArea
          rows={3}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Nhập lý do hủy..."
        />
      </Modal>
    </div>
  )
}
