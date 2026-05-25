import React from 'react';
import { Layout } from 'antd';
import './index.less';

const { Footer } = Layout;

const GlobalFooter: React.FC = () => {
  return (
    <Footer className="footer">
      <div className="footer-content">
        <p className="copyright">
          <a
            href="https://www.codefather.cn"
            target="_blank"
            rel="noopener noreferrer"
            className="author-link"
          >
            编程导航原创项目
          </a>
        </p>
      </div>
    </Footer>
  );
};

export default GlobalFooter;

