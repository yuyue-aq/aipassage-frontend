import React from 'react';
import { Layout } from 'antd';
import { Outlet } from '@umijs/max';
import GlobalHeader from '@/components/GlobalHeader';
import GlobalFooter from '@/components/GlobalFooter';
import './BasicLayout.less';

const { Content } = Layout;

const BasicLayout: React.FC = () => {
  return (
    <Layout className="basic-layout">
      <GlobalHeader />
      <Content className="main-content">
        <Outlet />
      </Content>
      <GlobalFooter />
    </Layout>
  );
};

export default BasicLayout;

