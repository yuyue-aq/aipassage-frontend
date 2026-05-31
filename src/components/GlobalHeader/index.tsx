import React, { useMemo } from 'react';
import { Avatar, Dropdown, Layout, message, Space, Tooltip } from 'antd';
import { Link, useLocation, useModel } from '@umijs/max';
import {
  BarChartOutlined,
  CrownOutlined,
  EditOutlined,
  HomeOutlined,
  LogoutOutlined,
  MoonOutlined,
  SettingOutlined,
  SunOutlined,
  UnorderedListOutlined,
} from '@ant-design/icons';
import useTheme from '@/hooks/useTheme';
import { userLogoutUsingPost } from '@/services/backend/userController';
import { isVip as checkIsVip } from '@/utils/permission';
import logo from '@/assets/logo.png';
import './index.less';

const { Header } = Layout;

const GlobalHeader: React.FC = () => {
  const location = useLocation();
  const { initialState, setInitialState } = useModel('@@initialState');
  const currentUser = initialState?.currentUser;
  const isVip = useMemo(() => checkIsVip(currentUser), [currentUser]);
  const { theme, toggleTheme } = useTheme();

  const menuItems = useMemo(
    () =>
      [
        { key: '/', icon: <HomeOutlined />, label: '首页' },
        { key: '/create', icon: <EditOutlined />, label: '创作' },
        { key: '/article/list', icon: <UnorderedListOutlined />, label: '历史' },
        { key: '/admin/userManage', icon: <SettingOutlined />, label: '管理', admin: true },
        { key: '/admin/statistics', icon: <BarChartOutlined />, label: '数据', admin: true },
      ].filter((item) => !item.admin || currentUser?.userRole === 'admin'),
    [currentUser?.userRole],
  );

  const handleLogout = async () => {
    const res = await userLogoutUsingPost();
    if (res?.code === 0) {
      setInitialState({
        ...(initialState || {}),
        currentUser: undefined,
      });
      message.success('退出登录成功');
    } else {
      message.error(`退出登录失败，${res?.message || ''}`);
    }
  };

  const dropdownItems = [
    ...(isVip
      ? [
          {
            key: 'vip-info',
            icon: <CrownOutlined />,
            label: '永久会员权益',
            onClick: () => null,
            className: 'vip-info-item',
          },
          { type: 'divider' as const },
        ]
      : []),
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      onClick: handleLogout,
      className: 'dropdown-item',
    },
  ];

  return (
    <Header className="header">
      <div className="header-container">
        <div className="header-left">
          <Link to="/" className="logo-link">
            <div className="logo-wrapper">
              <img src={logo} alt="Logo" className="logo-img" />
              <h1 className="site-title">AI文章创作器</h1>
            </div>
          </Link>
        </div>

        <nav className="nav-center">
          {menuItems.map((item) => (
            <Link
              key={item.key}
              to={item.key}
              className={`nav-item${location.pathname === item.key ? ' active' : ''}`}
            >
              <span className="nav-icon">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="header-right">
          <Tooltip title={theme === 'light' ? '切换深色主题' : '切换浅色主题'}>
            <span className="theme-toggle" onClick={toggleTheme}>
              {theme === 'light' ? <MoonOutlined /> : <SunOutlined />}
            </span>
          </Tooltip>
          {currentUser?.id ? (
            <div className="user-dropdown">
              {!isVip ? (
                <Link to="/vip" className="upgrade-vip-btn">
                  <CrownOutlined />
                  <span>升级 VIP</span>
                </Link>
              ) : (
                <Link to="/vip" className="vip-badge">
                  <CrownOutlined />
                  <span>VIP</span>
                </Link>
              )}

              <Dropdown menu={{ items: dropdownItems }} placement="bottomRight">
                <Space className="user-info">
                  <Avatar src={currentUser.userAvatar} size={36} className="user-avatar" />
                  <span className="user-name">{currentUser.userName || '无名'}</span>
                </Space>
              </Dropdown>
            </div>
          ) : (
            <Link to="/user/login" className="login-btn">
              登录
            </Link>
          )}
        </div>
      </div>
    </Header>
  );
};

export default GlobalHeader;

