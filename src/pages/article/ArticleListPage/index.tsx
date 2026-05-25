import React, { useEffect, useMemo, useState } from 'react';
import { Button, Card, DatePicker, Input, Modal, Select, Table, message } from 'antd';
import {
  DeleteOutlined,
  DownloadOutlined,
  EyeOutlined,
  FileTextOutlined,
  PlusOutlined,
  RedoOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import { useNavigate } from '@umijs/max';
import dayjs, { type Dayjs } from 'dayjs';
import {
  deleteArticleUsingPost,
  getArticleUsingGet,
  listArticleUsingPost,
} from '@/services/backend/articleController';
import { exportAsMarkdown, getStatusText } from '@/utils/article';
import './index.less';

const { RangePicker } = DatePicker;

const ArticleListPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchKeyword, setSearchKeyword] = useState('');
  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs] | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [dataSource, setDataSource] = useState<API.ArticleVO[]>([]);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  const columns = useMemo(
    () => [
      {
        title: '选题',
        dataIndex: 'topic',
        key: 'topic',
        width: 180,
        ellipsis: true,
      },
      {
        title: '标题',
        key: 'title',
        width: 280,
        render: (_: unknown, record: API.ArticleVO) => (
          <div className="title-cell" onClick={() => viewArticle(record)}>
            <div className="main-title">{record.mainTitle || record.topic || '-'}</div>
            <div className="sub-title">{record.subTitle || '-'}</div>
          </div>
        ),
      },
      {
        title: '状态',
        key: 'status',
        width: 110,
        render: (_: unknown, record: API.ArticleVO) => (
          <span className={`status-badge status-${record.status?.toLowerCase()}`}>
            <span className="status-dot" />
            {getStatusText(record.status || '')}
          </span>
        ),
      },
      {
        title: '创建时间',
        key: 'createTime',
        width: 160,
        render: (_: unknown, record: API.ArticleVO) => (
          <span className="time-text">{formatDate(record.createTime || '')}</span>
        ),
      },
      {
        title: '操作',
        key: 'action',
        width: 200,
        render: (_: unknown, record: API.ArticleVO) => (
          <div className="action-group">
            <Button type="link" size="small" onClick={() => viewArticle(record)} className="action-btn view-btn">
              <EyeOutlined />
              查看
            </Button>
            {record.status === 'FAILED' ? (
              <Button type="link" size="small" onClick={() => retryArticle(record)} className="action-btn retry-btn">
                <RedoOutlined />
                重试
              </Button>
            ) : (
              <Button type="link" size="small" onClick={() => exportArticle(record)} className="action-btn export-btn">
                <DownloadOutlined />
                导出
              </Button>
            )}
            <Button type="link" size="small" danger className="action-btn delete-btn" onClick={() => deleteArticle(record)}>
              <DeleteOutlined />
              删除
            </Button>
          </div>
        ),
      },
    ],
    [],
  );

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await listArticleUsingPost({
        pageNum: pagination.current,
        pageSize: pagination.pageSize,
      });
      const pageData = res?.data;
      let records = pageData?.records || [];

      if (searchKeyword) {
        const keyword = searchKeyword.toLowerCase();
        records = records.filter(
          (item) => item.mainTitle?.toLowerCase().includes(keyword) || item.topic?.toLowerCase().includes(keyword),
        );
      }

      if (statusFilter) {
        records = records.filter((item) => item.status === statusFilter);
      }

      if (dateRange) {
        const [start, end] = dateRange;
        records = records.filter((item) => {
          const createTime = dayjs(item.createTime);
          return createTime.isAfter(start.startOf('day')) && createTime.isBefore(end.endOf('day'));
        });
      }

      setDataSource(records);
      setPagination((prev) => ({
        ...prev,
        total: pageData?.totalRow || 0,
      }));
    } catch (error: any) {
      message.error(error?.message || '加载失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagination.current, pagination.pageSize, statusFilter, searchKeyword, dateRange]);

  const viewArticle = (record: API.ArticleVO) => {
    navigate(`/article/${record.taskId}`);
  };

  const exportArticle = async (record: API.ArticleVO) => {
    try {
      const res = await getArticleUsingGet({ taskId: record.taskId || '' });
      const article = res?.data;
      if (!article) {
        message.error('文章数据不存在');
        return;
      }
      exportAsMarkdown({
        title: article.mainTitle || '文章',
        subTitle: article.subTitle,
        content: article.content,
        fullContent: article.fullContent,
        outline: article.outline?.map((item) => ({
          section: item.section || 0,
          title: item.title || '',
        })),
        images: article.images?.map((image) => ({
          description: image.description || '',
          url: image.url || '',
        })),
      });
      message.success('导出成功');
    } catch (error: any) {
      message.error(error?.message || '导出失败');
    }
  };

  const deleteArticle = async (record: API.ArticleVO) => {
    try {
      await deleteArticleUsingPost({ id: record.id } as API.DeleteRequest);
      message.success('删除成功');
      loadData();
    } catch (error: any) {
      message.error(error?.message || '删除失败');
    }
  };

  const retryArticle = (record: API.ArticleVO) => {
    Modal.confirm({
      title: '确认重试',
      content: `将使用相同的选题"${record.topic}"重新创建文章，是否继续？`,
      okText: '确认',
      cancelText: '取消',
      onOk: () =>
        navigate({
          pathname: '/create',
          search: `?topic=${encodeURIComponent(record.topic || '')}&style=${encodeURIComponent(record.userDescription || '')}`,
        }),
    });
  };

  const goToCreate = () => {
    navigate('/create');
  };

  const formatDate = (date: string) => {
    return dayjs(date).format('YYYY-MM-DD HH:mm');
  };

  return (
    <div className="article-list-page">
      <div className="page-header">
        <div className="header-container">
          <div className="header-content">
            <h1 className="page-title">历史记录</h1>
            <p className="page-subtitle">管理您创作的所有文章</p>
          </div>
          <Button type="primary" size="large" onClick={goToCreate} className="create-btn" icon={<PlusOutlined />}>
            创作新文章
          </Button>
        </div>
      </div>

      <div className="container">
        <div className="filter-bar">
          <div className="filter-left">
            <Input.Search
              value={searchKeyword}
              onChange={(event) => setSearchKeyword(event.target.value)}
              placeholder="搜索文章标题..."
              style={{ width: 280 }}
              allowClear
              className="search-input"
              onSearch={() => setPagination((prev) => ({ ...prev, current: 1 }))}
              prefix={<SearchOutlined className="search-icon" />}
            />
            <RangePicker
              value={dateRange}
              onChange={(values) => setDateRange(values as [Dayjs, Dayjs] | null)}
              placeholder={['开始日期', '结束日期']}
              className="date-picker"
            />
            <Select
              value={statusFilter}
              onChange={(value) => setStatusFilter(value)}
              placeholder="全部状态"
              style={{ width: 120 }}
              allowClear
              className="status-select"
            >
              <Select.Option value="">全部状态</Select.Option>
              <Select.Option value="COMPLETED">已完成</Select.Option>
              <Select.Option value="PROCESSING">生成中</Select.Option>
              <Select.Option value="PENDING">等待中</Select.Option>
              <Select.Option value="FAILED">失败</Select.Option>
            </Select>
          </div>
          <div className="filter-right">
            <span className="total-count">共 {pagination.total} 篇文章</span>
          </div>
        </div>

        <Card bordered={false} className="table-card">
          <Table
            rowKey="id"
            columns={columns as any}
            dataSource={dataSource}
            loading={loading}
            pagination={{
              current: pagination.current,
              pageSize: pagination.pageSize,
              total: pagination.total,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total) => `共 ${total} 条`,
              pageSizeOptions: ['10', '20', '50', '100'],
              onChange: (page, pageSize) =>
                setPagination((prev) => ({
                  ...prev,
                  current: page,
                  pageSize,
                })),
            }}
            className="article-table"
            locale={{
              emptyText: (
                <div className="empty-state">
                  <FileTextOutlined className="empty-icon" />
                  <p className="empty-title">暂无文章</p>
                  <p className="empty-desc">开始创作您的第一篇文章吧</p>
                  <Button type="primary" onClick={goToCreate} icon={<PlusOutlined />}>
                    创作新文章
                  </Button>
                </div>
              ),
            }}
          />
        </Card>
      </div>
    </div>
  );
};

export default ArticleListPage;

