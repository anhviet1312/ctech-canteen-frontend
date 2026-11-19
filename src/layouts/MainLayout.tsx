import { useState } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { Layout, Menu, Button, Avatar, Typography, Badge, Space, Tag, Dropdown } from 'antd'
import {
  DashboardOutlined,
  AppstoreOutlined,
  ShopOutlined,
  UnorderedListOutlined,
  ImportOutlined,
  ExportOutlined,
  DatabaseOutlined,
  RobotOutlined,
  BarChartOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  UserOutlined,
  BellOutlined,
} from '@ant-design/icons'
import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '../store/authStore'
import { getAlerts } from '../api/inventory'

const { Sider, Header, Content } = Layout
const { Text } = Typography

export default function MainLayout() {
  const [collapsed, setCollapsed] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout } = useAuthStore()

  const { data: alertsData } = useQuery({
    queryKey: ['inventory-alerts'],
    queryFn: () => getAlerts(),
    refetchInterval: 60000,
  })
  const alertCount = alertsData?.data?.length ?? 0

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const selectedKey = '/' + location.pathname.split('/')[1]

  const menuItems = [
    {
      key: '/dashboard',
      icon: <DashboardOutlined />,
      label: 'Tổng quan',
    },
    {
      key: 'hang-hoa',
      icon: <AppstoreOutlined />,
      label: 'Hàng hóa',
      children: [
        {
          key: '/categories',
          icon: <UnorderedListOutlined />,
          label: 'Danh mục hàng hóa',
        },
        {
          key: '/suppliers',
          icon: <ShopOutlined />,
          label: 'Nhà cung cấp',
        },
        {
          key: '/products',
          icon: <AppstoreOutlined />,
          label: 'Danh mục mặt hàng',
        },
      ],
    },
    {
      key: 'nhap-xuat',
      icon: <ImportOutlined />,
      label: 'Nhập - Xuất kho',
      children: [
        {
          key: '/imports',
          icon: <ImportOutlined />,
          label: 'Phiếu nhập kho',
        },
        {
          key: '/exports',
          icon: <ExportOutlined />,
          label: 'Phiếu xuất kho',
        },
      ],
    },
    {
      key: '/inventory',
      icon: <DatabaseOutlined />,
      label: (
        <Space>
          Tồn kho
          {alertCount > 0 && <Badge count={alertCount} size="small" />}
        </Space>
      ),
    },
    {
      key: '/proposals',
      icon: <RobotOutlined />,
      label: 'Đề xuất nhập hàng',
    },
    {
      key: '/reports',
      icon: <BarChartOutlined />,
      label: 'Báo cáo',
    },
  ]

  const userMenuItems = [
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Đăng xuất',
      onClick: handleLogout,
    },
  ]

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        trigger={null}
        width={240}
        style={{
          background: '#001529',
          overflow: 'auto',
          height: '100vh',
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
          zIndex: 100,
        }}
      >
        <div
          style={{
            height: 64,
            display: 'flex',
            alignItems: 'center',
            justifyContent: collapsed ? 'center' : 'flex-start',
            padding: collapsed ? 0 : '0 16px',
            borderBottom: '1px solid rgba(255,255,255,0.1)',
          }}
        >
          <span style={{ fontSize: 24 }}>🏪</span>
          {!collapsed && (
            <Text
              strong
              style={{
                color: '#fff',
                marginLeft: 8,
                fontSize: 14,
                lineHeight: 1.3,
              }}
            >
              Căng Tin CTECH
            </Text>
          )}
        </div>

        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[selectedKey]}
          defaultOpenKeys={['hang-hoa', 'nhap-xuat']}
          items={menuItems}
          onClick={({ key }) => {
            if (!key.startsWith('hang-hoa') && !key.startsWith('nhap-xuat')) {
              navigate(key)
            }
          }}
          style={{ marginTop: 8 }}
        />
      </Sider>

      <Layout style={{ marginLeft: collapsed ? 80 : 240, transition: 'margin-left 0.2s' }}>
        <Header
          style={{
            padding: '0 24px',
            background: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 1px 4px rgba(0,21,41,.08)',
            position: 'sticky',
            top: 0,
            zIndex: 99,
          }}
        >
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
            style={{ fontSize: 16, width: 40, height: 40 }}
          />

          <Space>
            {alertCount > 0 && (
              <Badge count={alertCount} title={`${alertCount} mặt hàng dưới ngưỡng tồn kho`}>
                <Button
                  type="text"
                  icon={<BellOutlined style={{ fontSize: 18, color: '#faad14' }} />}
                  onClick={() => navigate('/inventory')}
                />
              </Badge>
            )}
            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
              <Space style={{ cursor: 'pointer' }}>
                <Avatar icon={<UserOutlined />} style={{ backgroundColor: '#1677ff' }} />
                <div style={{ lineHeight: 1.3 }}>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{user?.full_name}</div>
                  <Tag color={user?.role === 'manager' ? 'blue' : 'green'} style={{ margin: 0, fontSize: 11 }}>
                    {user?.role === 'manager' ? 'Quản lý' : 'Nhân viên'}
                  </Tag>
                </div>
              </Space>
            </Dropdown>
          </Space>
        </Header>

        <Content style={{ padding: 24, background: '#f0f2f5', minHeight: 'calc(100vh - 64px)' }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  )
}
