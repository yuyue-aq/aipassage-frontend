import React from 'react';
import { Button, Form, Input, message } from 'antd';
import { CheckCircleOutlined, LockOutlined, UserOutlined } from '@ant-design/icons';
import { Link, useModel, useNavigate } from '@umijs/max';
import { userLoginUsingPost } from '@/services/backend/userController';
import AuthBrandSection from '@/components/AuthBrandSection';
import './index.less';

const UserLoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { initialState, setInitialState } = useModel('@@initialState');

  const handleSubmit = async (values: API.UserLoginRequest) => {
    try {
      const res = await userLoginUsingPost(values);
      if (res?.code === 0 && res.data) {
        setInitialState({
          ...(initialState || {}),
          currentUser: res.data,
        });
        message.success('登录成功');
        navigate('/', { replace: true });
      } else {
        message.error('用户名不存在或密码错误');
      }
    } catch (error: any) {
      message.error('用户名不存在或密码错误');
    }
  };

  return (
    <div id="userLoginPage">
      <div className="auth-container">
        <AuthBrandSection />

        <div className="form-section">
          <div className="form-card">
            <h2 className="form-title">欢迎回来</h2>
            <p className="form-subtitle">登录您的账号继续创作</p>

            <Form layout="vertical" name="login" onFinish={handleSubmit} className="login-form">
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
                  { min: 8, message: '密码长度不能小于 8 位' },
                ]}
              >
                <Input.Password
                  placeholder="请输入密码"
                  size="large"
                  className="form-input"
                  prefix={<LockOutlined className="input-icon" />}
                />
              </Form.Item>
              <Form.Item>
                <Button type="primary" htmlType="submit" size="large" block className="submit-btn">
                  登录
                </Button>
              </Form.Item>
            </Form>

            <div className="form-footer">
              <span className="footer-text">还没有账号？</span>
              <Link to="/user/register" className="register-link">
                立即注册
              </Link>
            </div>

            <div className="feature-hint">
              <CheckCircleOutlined className="feature-check" />
              智能生成标题与大纲
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserLoginPage;
