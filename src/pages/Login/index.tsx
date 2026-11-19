import { useState } from 'react'
import { Form, Input, Button, Card, Typography, message, Alert } from 'antd'
import { UserOutlined, LockOutlined } from '@ant-design/icons'
import { useMutation } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { login } from '../../api/auth'
import { useAuthStore } from '../../store/authStore'

const { Title, Text } = Typography

export default function LoginPage() {
  const navigate = useNavigate()
  const { login: storeLogin } = useAuthStore()
  const [errorMsg, setErrorMsg] = useState('')

  const mutation = useMutation({
    mutationFn: ({ username, password }: { username: string; password: string }) =>
      login(username, password),
    onSuccess: (res) => {
      const { access_token, user } = res.data
      storeLogin(access_token, user)
      message.success('Đăng nhập thành công!')
      navigate('/dashboard')
    },
    onError: () => {
      setErrorMsg('Sai tên đăng nhập hoặc mật khẩu!')
    },
  })

  const onFinish = (values: { username: string; password: string }) => {
    setErrorMsg('')
    mutation.mutate(values)
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #1677ff 0%, #0050b3 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
      }}
    >
      <Card
        style={{
          width: '100%',
          maxWidth: 420,
          borderRadius: 16,
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        }}
        bodyStyle={{ padding: '40px 32px' }}
      >
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🏪</div>
          <Title level={3} style={{ margin: 0, color: '#1677ff' }}>
            Hệ Thống Quản Lý Tồn Kho
          </Title>
          <Text type="secondary" style={{ fontSize: 15 }}>
            Căng Tin CTECH
          </Text>
        </div>

        {errorMsg && (
          <Alert
            message={errorMsg}
            type="error"
            showIcon
            style={{ marginBottom: 16 }}
            closable
            onClose={() => setErrorMsg('')}
          />
        )}

        <Form name="login" onFinish={onFinish} layout="vertical" size="large">
          <Form.Item
            name="username"
            label="Tên đăng nhập"
            rules={[{ required: true, message: 'Vui lòng nhập tên đăng nhập!' }]}
          >
            <Input prefix={<UserOutlined />} placeholder="Nhập tên đăng nhập" />
          </Form.Item>

          <Form.Item
            name="password"
            label="Mật khẩu"
            rules={[{ required: true, message: 'Vui lòng nhập mật khẩu!' }]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="Nhập mật khẩu" />
          </Form.Item>

          <Form.Item style={{ marginBottom: 8 }}>
            <Button
              type="primary"
              htmlType="submit"
              block
              loading={mutation.isPending}
              style={{ height: 44, fontSize: 16, borderRadius: 8 }}
            >
              Đăng nhập
            </Button>
          </Form.Item>
        </Form>

        <div
          style={{
            textAlign: 'center',
            marginTop: 16,
            padding: '12px 16px',
            background: '#f6f8fa',
            borderRadius: 8,
          }}
        >
          <Text type="secondary" style={{ fontSize: 13 }}>
            💡 Tài khoản demo:
          </Text>
          <br />
          <Text code>admin/admin123</Text> hoặc <Text code>nhanvien/nv123</Text>
        </div>
      </Card>
    </div>
  )
}
