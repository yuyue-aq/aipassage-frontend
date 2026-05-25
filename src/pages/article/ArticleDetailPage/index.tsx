import React, { useEffect, useState } from 'react';
import { Button, Card, Divider, Modal, Spin, Tag, message } from 'antd';
import {
  ArrowLeftOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  DownloadOutlined,
  FileTextOutlined,
  LoadingOutlined,
  OrderedListOutlined,
  PictureOutlined,
  RedoOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';
import { useNavigate, useParams } from '@umijs/max';
import dayjs from 'dayjs';
import { getArticleUsingGet, getExecutionLogsUsingGet } from '@/services/backend/articleController';
import { markdownToHtml } from '@/utils/markdown';
import './index.less';

const ArticleDetailPage: React.FC = () => {
  const navigate = useNavigate();
  const params = useParams();
  const taskId = params.taskId as string;
  const [loading, setLoading] = useState(false);
  const [article, setArticle] = useState<API.ArticleVO | null>(null);
  const [executionStats, setExecutionStats] = useState<API.AgentExecutionStats | null>(null);
  const [showExecutionLogs, setShowExecutionLogs] = useState(false);

  const loadArticle = async () => {
    if (!taskId) {
      message.error('文章ID不存在');
      return;
    }

    setLoading(true);
    try {
      const res = await getArticleUsingGet({ taskId });
      setArticle(res?.data || null);
      const logs = await getExecutionLogsUsingGet({ taskId });
      setExecutionStats(logs?.data || null);
    } catch (error: any) {
      message.error(error?.message || '加载失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadArticle();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [taskId]);

  const exportMarkdown = () => {
    if (!article) return;

    let markdown = `# ${article.mainTitle}\n\n`;
    markdown += `> ${article.subTitle}\n\n`;

    if (article.fullContent) {
      markdown += article.fullContent;
    } else {
      if (article.outline && article.outline.length > 0) {
        markdown += `## 目录\n\n`;
        article.outline.forEach((item) => {
          markdown += `${item.section}. ${item.title}\n`;
        });
        markdown += `\n---\n\n`;
      }

      markdown += article.content || '';

      if (article.images && article.images.length > 0) {
        markdown += `\n\n## 配图\n\n`;
        article.images.forEach((image) => {
          markdown += `![${image.description}](${image.url})\n\n`;
        });
      }
    }

    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${article.mainTitle}.md`;
    anchor.click();
    URL.revokeObjectURL(url);

    message.success('导出成功');
  };

  const getStatusColor = (status: string) => {
    const colorMap: Record<string, string> = {
      PENDING: 'default',
      PROCESSING: 'processing',
      COMPLETED: 'success',
      FAILED: 'error',
    };
    return colorMap[status] || 'default';
  };

  const getStatusText = (status: string) => {
    const textMap: Record<string, string> = {
      PENDING: '等待中',
      PROCESSING: '生成中',
      COMPLETED: '已完成',
      FAILED: '失败',
    };
    return textMap[status] || status;
  };

  const getAgentDisplayName = (agentName: string) => {
    const nameMap: Record<string, string> = {
      agent1_generate_titles: '生成标题',
      agent2_generate_outline: '生成大纲',
      agent3_generate_content: '生成正文',
      agent4_analyze_image_requirements: '分析配图需求',
      agent5_generate_images: '生成配图',
      agent6_merge_content: '图文合成',
      ai_modify_outline: 'AI修改大纲',
    };
    return nameMap[agentName] || agentName;
  };

  const handleRetry = () => {
    if (!article) return;
    Modal.confirm({
      title: '确认重试',
      content: '将使用相同的选题和配置重新创建文章，是否继续？',
      okText: '确认',
      cancelText: '取消',
      onOk: () =>
        navigate({
          pathname: '/create',
          search: `?topic=${encodeURIComponent(article.topic || '')}`,
        }),
    });
  };

  return (
    <div className="article-detail-page">
      <div className="page-header">
        <div className="header-container">
          <div className="header-actions">
            <Button onClick={() => navigate(-1)} className="back-btn" icon={<ArrowLeftOutlined />}>
              返回
            </Button>
            <div className="right-actions">
              {article?.status === 'FAILED' && (
                <Button type="primary" danger onClick={handleRetry} className="retry-btn" icon={<RedoOutlined />}>
                  重新创建
                </Button>
              )}
              <Button type="primary" onClick={exportMarkdown} className="export-btn" icon={<DownloadOutlined />}>
                导出 Markdown
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container">
        <Spin spinning={loading} tip="加载中...">
          {article && (
            <Card bordered={false} className="article-card">
              <div className="title-section">
                <h1 className="main-title">{article.mainTitle}</h1>
                <p className="sub-title">{article.subTitle}</p>
                <div className="meta-info">
                  <Tag color={getStatusColor(article.status || '')} className="status-tag">
                    {getStatusText(article.status || '')}
                  </Tag>
                  <span className="time">
                    创建于 {article.createTime ? dayjs(article.createTime).format('YYYY-MM-DD HH:mm:ss') : ''}
                  </span>
                </div>
              </div>

              <Divider />

              {executionStats?.logs && executionStats.logs.length > 0 && (
                <div className="execution-logs-section">
                  <div className="logs-header" onClick={() => setShowExecutionLogs((prev) => !prev)}>
                    <h2 className="section-title">
                      <ClockCircleOutlined className="section-icon" />
                      执行日志
                      <Tag color={getStatusColor(executionStats.overallStatus || '')} className="status-tag-small">
                        {executionStats.overallStatus || ''}
                      </Tag>
                    </h2>
                    <ThunderboltOutlined className={`toggle-icon ${showExecutionLogs ? 'expanded' : ''}`} />
                  </div>

                  {showExecutionLogs && (
                    <div className="logs-content">
                      <div className="stats-summary">
                        <div className="stat-item">
                          <span className="label">总耗时</span>
                          <span className="value">{executionStats.totalDurationMs ?? 0}ms</span>
                        </div>
                        <div className="stat-item">
                          <span className="label">智能体数量</span>
                          <span className="value">{executionStats.agentCount ?? 0}</span>
                        </div>
                        <div className="stat-item">
                          <span className="label">平均耗时</span>
                          <span className="value">
                            {executionStats.agentCount && executionStats.totalDurationMs
                              ? Math.round(executionStats.totalDurationMs / executionStats.agentCount)
                              : 0}
                            ms
                          </span>
                        </div>
                      </div>

                      <div className="agent-timeline">
                        {executionStats.logs.map((log) => (
                          <div key={log.id} className={`timeline-item ${log.status?.toLowerCase()}`}>
                            <div className="timeline-indicator">
                              {log.status === 'SUCCESS' ? (
                                <CheckCircleOutlined className="icon success" />
                              ) : log.status === 'FAILED' ? (
                                <CloseCircleOutlined className="icon failed" />
                              ) : (
                                <LoadingOutlined className="icon running" />
                              )}
                            </div>
                            <div className="timeline-content">
                              <div className="timeline-header">
                                <span className="agent-name">{getAgentDisplayName(log.agentName || '')}</span>
                                <span className="duration">{log.durationMs ?? 0}ms</span>
                              </div>
                              <div className="timeline-time">
                                {log.startTime ? dayjs(log.startTime).format('YYYY-MM-DD HH:mm:ss') : ''}
                              </div>
                              {log.errorMessage && (
                                <div className="error-message">
                                  <CloseCircleOutlined /> {log.errorMessage}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {executionStats?.logs && executionStats.logs.length > 0 && <Divider />}

              {article.outline && article.outline.length > 0 && (
                <div className="outline-section">
                  <h2 className="section-title">
                    <OrderedListOutlined className="section-icon" />
                    文章大纲
                  </h2>
                  <div className="outline-list">
                    {article.outline.map((item) => (
                      <div key={item.section} className="outline-item">
                        <div className="outline-title">
                          {item.section}. {item.title}
                        </div>
                        <ul className="outline-points">
                          {item.points?.map((point, idx) => (
                            <li key={idx}>{point}</li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {article.outline && article.outline.length > 0 && <Divider />}

              {article.fullContent ? (
                <div className="content-section">
                  <h2 className="section-title">
                    <FileTextOutlined className="section-icon" />
                    完整图文
                  </h2>
                  <div
                    className="markdown-content"
                    dangerouslySetInnerHTML={{ __html: markdownToHtml(article.fullContent) }}
                  />
                </div>
              ) : article.content ? (
                <div className="content-section">
                  <h2 className="section-title">
                    <FileTextOutlined className="section-icon" />
                    文章正文
                  </h2>
                  <div
                    className="markdown-content"
                    dangerouslySetInnerHTML={{ __html: markdownToHtml(article.content) }}
                  />
                </div>
              ) : null}

              {!article.fullContent && article.images && article.images.length > 0 && (
                <div className="images-section">
                  <h2 className="section-title">
                    <PictureOutlined className="section-icon" />
                    文章配图
                  </h2>
                  <div className="images-grid">
                    {article.images.map((image) => (
                      <div key={image.position} className="image-item">
                        <img src={image.url} alt={image.description} />
                        <div className="image-info">
                          <span className="badge">{image.method}</span>
                          <span className="keywords">{image.keywords}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          )}
        </Spin>
      </div>
    </div>
  );
};

export default ArticleDetailPage;

