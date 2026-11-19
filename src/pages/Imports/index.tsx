import { useState } from 'react'
import { Table, Button, Modal, Typography, Space, Tag, DatePicker, Descriptions } from 'antd'
import { PlusOutlined, EyeOutlined } from '@ant-design/icons'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { getImports } from '../../api/imports'
import { ImportOrder, ImportItem } from '../../types'
import dayjs from 'dayjs'

const { Title } = Typography
const { RangePicker } = DatePicker

const fmtVND = (val: number) => val?.toLocaleString('vi-VN') + ' ₫'
const fmtDate = (d: string) => (d ? dayjs(d).format('DD/MM/YYYY HH:mm') : '—')

export default function ImportsPage() {
  const navigate = useNavigate()
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null]>([null, null])
  const [detailModal, setDetailModal] = useState<ImportOrder | null>(null)

  const params: any = {}
  if (dateRange[0]) params.start_date = dateRange[0].format('YYYY-MM-DD')
  if (dateRange[1]) params.end_date = dateRange[1].format('YYYY-MM-DD')

  const { data, isLoading } = useQuery({
    queryKey: ['imports', params],
    queryFn: () => getImports(params),
  })

  const imports: ImportOrder[] = data?.data ?? []

  const itemColumns = [
    { title: 'Tên hàng', key: 'name', render: (_: any, r: ImportItem) => r.product?.name ?? r.product_id },
    { title: 'Số lượng', dataIndex: 'quantity', key: 'quantity' },
    { title: 'Đơn giá', dataIndex: 'unit_price', key: 'unit_price', render: (v: number) => fmtVND(v) },
    { title: 'Thành tiền', key: 'total', render: (_: any, r: ImportItem) => fmtVND(r.quantity * r.unit_price) },
    { title: 'Hạn sử dụng', dataIndex: 'expiry_date', key: 'expiry_date', render: (v: string) => v ? dayjs(v).format('DD/MM/YYYY') : '—' },
  ]

  const columns = [
    { title: 'Mã phiếu', dataIndex: 'code', key: 'code', width: 130 },
    { title: 'Nhà cung cấp', key: 'supplier', render: (_: any, r: ImportOrder) => r.supplier?.name ?? '—' },
    { title: 'Ngày nhập', dataIndex: 'created_at', key: 'created_at', render: fmtDate },
    {
      title: 'Số mặt hàng',
      key: 'items_count',
      render: (_: any, r: ImportOrder) => r.items?.length ?? 0,
    },
    {
      title: 'Tổng giá trị',
      dataIndex: 'total_amount',
      key: 'total_amount',
      render: (v: number) => fmtVND(v),
    },
    { title: 'Người tạo', key: 'creator', render: (_: any, r: ImportOrder) => r.creator?.full_name ?? '—' },
    {
      title: 'Hành động',
      key: 'action',
      render: (_: any, record: ImportOrder) => (
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
          📥 Phiếu nhập kho
        </Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/imports/create')}>
          Tạo phiếu nhập
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
        dataSource={imports}
        columns={columns}
        rowKey="id"
        loading={isLoading}
        pagination={{ pageSize: 15 }}
      />

      <Modal
        title={`Chi tiết phiếu nhập: ${detailModal?.code}`}
        open={!!detailModal}
        onCancel={() => setDetailModal(null)}
        footer={null}
        width={800}
      >
        {detailModal && (
          <>
            <Descriptions bordered size="small" column={2} style={{ marginBottom: 16 }}>
              <Descriptions.Item label="Mã phiếu">{detailModal.code}</Descriptions.Item>
              <Descriptions.Item label="Ngày nhập">{fmtDate(detailModal.created_at)}</Descriptions.Item>
              <Descriptions.Item label="Nhà cung cấp">{detailModal.supplier?.name ?? '—'}</Descriptions.Item>
              <Descriptions.Item label="Người tạo">{detailModal.creator?.full_name ?? '—'}</Descriptions.Item>
              <Descriptions.Item label="Tổng giá trị" span={2}>
                <strong style={{ color: '#1677ff' }}>{fmtVND(detailModal.total_amount)}</strong>
              </Descriptions.Item>
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
              summary={(rows) => (
                <Table.Summary>
                  <Table.Summary.Row>
                    <Table.Summary.Cell index={0} colSpan={3}><strong>Tổng cộng</strong></Table.Summary.Cell>
                    <Table.Summary.Cell index={3}>
                      <strong style={{ color: '#1677ff' }}>
                        {fmtVND(rows.reduce((s, r) => s + r.quantity * r.unit_price, 0))}
                      </strong>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={4} />
                  </Table.Summary.Row>
                </Table.Summary>
              )}
            />
          </>
        )}
      </Modal>
    </div>
  )
}
