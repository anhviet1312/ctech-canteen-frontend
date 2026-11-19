import { useState } from 'react'
import { Table, Button, Modal, Typography, Space, DatePicker, Descriptions } from 'antd'
import { PlusOutlined, EyeOutlined } from '@ant-design/icons'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { getExports } from '../../api/exports'
import { ExportOrder, ExportItem } from '../../types'
import dayjs from 'dayjs'

const { Title } = Typography
const { RangePicker } = DatePicker

const fmtDate = (d: string) => (d ? dayjs(d).format('DD/MM/YYYY HH:mm') : '—')

export default function ExportsPage() {
  const navigate = useNavigate()
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null]>([null, null])
  const [detailModal, setDetailModal] = useState<ExportOrder | null>(null)

  const params: any = {}
  if (dateRange[0]) params.start_date = dateRange[0].format('YYYY-MM-DD')
  if (dateRange[1]) params.end_date = dateRange[1].format('YYYY-MM-DD')

  const { data, isLoading } = useQuery({
    queryKey: ['exports', params],
    queryFn: () => getExports(params),
  })

  const exports_: ExportOrder[] = data?.data ?? []

  const reasonMap: Record<string, string> = {
    'Tiêu thụ': 'Tiêu thụ',
    'Hư hỏng': 'Hư hỏng',
    'Hết hạn': 'Hết hạn',
    'Khác': 'Khác',
  }

  const itemColumns = [
    { title: 'Tên hàng', key: 'name', render: (_: any, r: ExportItem) => r.product?.name ?? r.product_id },
    { title: 'Đơn vị', key: 'unit', render: (_: any, r: ExportItem) => r.product?.unit ?? '—' },
    { title: 'Số lượng', dataIndex: 'quantity', key: 'quantity' },
  ]

  const columns = [
    { title: 'Mã phiếu', dataIndex: 'code', key: 'code', width: 130 },
    { title: 'Lý do xuất', dataIndex: 'reason', key: 'reason', render: (v: string) => reasonMap[v] ?? v },
    { title: 'Ngày xuất', dataIndex: 'created_at', key: 'created_at', render: fmtDate },
    {
      title: 'Số mặt hàng',
      key: 'items_count',
      render: (_: any, r: ExportOrder) => r.items?.length ?? 0,
    },
    { title: 'Người tạo', key: 'creator', render: (_: any, r: ExportOrder) => r.creator?.full_name ?? '—' },
    {
      title: 'Hành động',
      key: 'action',
      render: (_: any, record: ExportOrder) => (
        <Button icon={<EyeOutlined />} size="small" onClick={() => setDetailModal(record)}>
          Xem chi tiết
        </Button>
      ),
    },
  ]

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <Title level={4} style={{ margin: 0 }}>
          📤 Phiếu xuất kho
        </Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/exports/create')}>
          Tạo phiếu xuất
        </Button>
      </div>

      <Space style={{ marginBottom: 16 }}>
        <RangePicker
          placeholder={['Từ ngày', 'Đến ngày']}
          format="DD/MM/YYYY"
          onChange={(dates) => setDateRange(dates as any ?? [null, null])}
        />
      </Space>

      <Table
        dataSource={exports_}
        columns={columns}
        rowKey="id"
        loading={isLoading}
        pagination={{ pageSize: 15 }}
      />

      <Modal
        title={`Chi tiết phiếu xuất: ${detailModal?.code}`}
        open={!!detailModal}
        onCancel={() => setDetailModal(null)}
        footer={null}
        width={700}
      >
        {detailModal && (
          <>
            <Descriptions bordered size="small" column={2} style={{ marginBottom: 16 }}>
              <Descriptions.Item label="Mã phiếu">{detailModal.code}</Descriptions.Item>
              <Descriptions.Item label="Ngày xuất">{fmtDate(detailModal.created_at)}</Descriptions.Item>
              <Descriptions.Item label="Lý do">{detailModal.reason}</Descriptions.Item>
              <Descriptions.Item label="Người tạo">{detailModal.creator?.full_name ?? '—'}</Descriptions.Item>
              {detailModal.notes && (
                <Descriptions.Item label="Ghi chú" span={2}>{detailModal.notes}</Descriptions.Item>
              )}
            </Descriptions>
            <Table
              dataSource={detailModal.items}
              columns={itemColumns}
              rowKey="id"
              pagination={false}
              size="small"
            />
          </>
        )}
      </Modal>
    </div>
  )
}
