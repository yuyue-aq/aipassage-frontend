import React from 'react';
import { Layout } from 'antd';
import './index.less';

const { Footer } = Layout;

const GlobalFooter: React.FC = () => {
  return (
    <Footer className="footer">
      <div className="footer-content">
        <p className="copyright">
          AI Passage ©{new Date().getFullYear()}
        </p>
      </div>
    </Footer>
  );
};

export default GlobalFooter;

