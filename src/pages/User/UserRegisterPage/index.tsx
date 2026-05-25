import React from 'react';
import { Button, Form, Input, message } from 'antd';
import { LockOutlined, SafetyOutlined, UserOutlined } from '@ant-design/icons';
import { Link, useNavigate } from '@umijs/max';
import { userRegisterUsingPost } from '@/services/backend/userController';
import AuthBrandSection from '@/components/AuthBrandSection';
import './index.less';

const UserRegisterPage: React.FC = () => {
  const navigate = useNavigate();

  const handleSubmit = async (values: API.UserRegisterRequest) => {
    if (values.userPassword !== values.checkPassword) {
      message.error('两次输入密码不一致');
      return;
    }

    const res = await userRegisterUsingPost(values);
    if (res?.code === 0) {
      message.success('注册成功');
      navigate('/user/login', { replace: true });
    } else {
      message.error(`注册失败，${res?.message || ''}`);
    }
  };

  return (
    <div id="userRegisterPage">
      <div className="auth-container">
        <AuthBrandSection />

        <div className="form-section">
          <div className="form-card">
            <h2 className="form-title">创建账号</h2>
            <p className="form-subtitle">注册开启您的 AI 创作之旅</p>

            <Form layout="vertical" name="register" onFinish={handleSubmit} className="register-form">
              <Form.Item
                name="userAccount"
                rules={[{ required: true, message: '请输入账号' }]}
              >
                <Input
                  placeholder="请输入账号"
                  size="large"
                  className="form-input"
                  prefix={<UserOutlined className="input-icon" />}
                />
              </Form.Item>
              <Form.Item
                name="userPassword"
                rules={[
                  { required: true, message: '请输入密码' },
                  { min: 8, message: '密码不能小于 8 位' },
                ]}
              >
                <Input.Password
                  placeholder="请输入密码"
                  size="large"
                  className="form-input"
                  prefix={<LockOutlined className="input-icon" />}
                />
              </Form.Item>
              <Form.Item
                name="checkPassword"
                dependencies={['userPassword']}
                rules={[
                  { required: true, message: '请确认密码' },
                  { min: 8, message: '密码不能小于 8 位' },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (!value || getFieldValue('userPassword') === value) {
                        return Promise.resolve();
                      }
                      return Promise.reject(new Error('两次输入密码不一致'));
                    },
                  }),
                ]}
              >
                <Input.Password
                  placeholder="请确认密码"
                  size="large"
                  className="form-input"
                  prefix={<SafetyOutlined className="input-icon" />}
                />
              </Form.Item>
              <Form.Item>
                <Button type="primary" htmlType="submit" size="large" block className="submit-btn">
                  注册
                </Button>
              </Form.Item>
            </Form>

            <div className="form-footer">
              <span className="footer-text">已有账号？</span>
              <Link to="/user/login" className="login-link">
                立即登录
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserRegisterPage;

