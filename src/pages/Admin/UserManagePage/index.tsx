import React, { useEffect, useMemo, useState } from 'react';
import { Avatar, Button, Card, Divider, Form, Input, message, Popconfirm, Table } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { deleteUserUsingPost, listUserVoByPageUsingPost } from '@/services/backend/userController';
import './index.less';

const UserManagePage: React.FC = () => {
  const [data, setData] = useState<API.UserVO[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [searchParams, setSearchParams] = useState<API.UserQueryRequest>({
    pageNum: 1,
    pageSize: 10,
  });

  const fetchData = async () => {
    setLoading(true);
    const res = await listUserVoByPageUsingPost({
      ...searchParams,
    } as API.UserQueryRequest);

    if (res?.data) {
      setData(res.data.records || []);
      setTotal(res.data.totalRow || 0);
    } else {
      message.error(`获取数据失败，${res?.message || ''}`);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams.pageNum, searchParams.pageSize]);

  const columns = useMemo(
    () => [
      { title: 'id', dataIndex: 'id' },
      { title: '账号', dataIndex: 'userAccount' },
      { title: '用户名', dataIndex: 'userName' },
      {
        title: '头像',
        dataIndex: 'userAvatar',
        render: (value: string) => <Avatar src={value} size={48} className="user-avatar" />,
      },
      { title: '简介', dataIndex: 'userProfile' },
      {
        title: '用户角色',
        dataIndex: 'userRole',
        render: (value: string) => (
          <span className={`role-tag ${value === 'admin' ? 'admin' : 'user'}`}>
            {value === 'admin' ? '管理员' : '普通用户'}
          </span>
        ),
      },
      {
        title: '创建时间',
        dataIndex: 'createTime',
        render: (value: string) => dayjs(value).format('YYYY-MM-DD HH:mm:ss'),
      },
      {
        title: '操作',
        key: 'action',
        render: (_: unknown, record: API.UserVO) => (
          <Popconfirm
            title="确定要删除此用户吗?"
            okText="确定"
            cancelText="取消"
            onConfirm={() => handleDelete(record.id)}
          >
            <Button type="link" danger className="delete-btn">
              删除
            </Button>
          </Popconfirm>
        ),
      },
    ],
    [],
  );

  const handleDelete = async (id?: number) => {
    if (!id) return;
    const res = await deleteUserUsingPost({ id } as API.DeleteRequest);
    if (res?.code === 0) {
      message.success('删除成功');
      fetchData();
    } else {
      message.error('删除失败');
    }
  };

  const handleSearch = (values: API.UserQueryRequest) => {
    setSearchParams((prev) => ({
      ...prev,
      pageNum: 1,
      ...values,
    }));
  };

  return (
    <div id="userManagePage">
      <div className="page-header">
        <div className="header-container">
          <div className="header-content">
            <h1 className="page-title">用户管理</h1>
            <p className="page-subtitle">管理系统中的所有用户</p>
          </div>
        </div>
      </div>

      <div className="container">
        <Card variant="borderless" className="content-card">
          <div className="search-section">
            <Form layout="inline" onFinish={handleSearch} className="search-form">
              <Form.Item label="账号" name="userAccount">
                <Input placeholder="输入账号" className="search-input" />
              </Form.Item>
              <Form.Item label="用户名" name="userName">
                <Input placeholder="输入用户名" className="search-input" />
              </Form.Item>
              <Form.Item>
                <Button type="primary" htmlType="submit" className="search-btn" icon={<SearchOutlined />}>
                  搜索
                </Button>
              </Form.Item>
            </Form>
          </div>

          <Divider />

          <Table
            rowKey="id"
            columns={columns as any}
            dataSource={data}
            loading={loading}
            pagination={{
              current: searchParams.pageNum,
              pageSize: searchParams.pageSize,
              total,
              showSizeChanger: true,
              showTotal: (value) => `共 ${value} 条`,
              onChange: (page, pageSize) =>
                setSearchParams((prev) => ({
                  ...prev,
                  pageNum: page,
                  pageSize,
                })),
            }}
            className="user-table"
          />
        </Card>
      </div>
    </div>
  );
};

export default UserManagePage;

