import React from 'react';
import { CheckCircleOutlined } from '@ant-design/icons';
import logo from '@/assets/logo.png';
import './index.less';

const AuthBrandSection: React.FC = () => {
  return (
    <div className="brand-section">
      <div className="brand-bg" />
      <div className="brand-content">
        <div className="brand-logo">
          <img src={logo} alt="Logo" className="logo-img" />
        </div>
        <h1 className="brand-title">AI 爆款文章创作器</h1>
        <p className="brand-subtitle">让每个人都能写出 10万+ 文章</p>
        <div className="brand-features">
          <div className="feature-item">
            <CheckCircleOutlined className="feature-check" />
            <span>智能生成标题与大纲</span>
          </div>
          <div className="feature-item">
            <CheckCircleOutlined className="feature-check" />
            <span>流式生成高质量正文</span>
          </div>
          <div className="feature-item">
            <CheckCircleOutlined className="feature-check" />
            <span>自动配图一键导出</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthBrandSection;

