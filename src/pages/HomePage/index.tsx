import React, { useEffect, useMemo, useState } from 'react';
import { Button, Input, Skeleton } from 'antd';
import {
  ClockCircleOutlined,
  EditOutlined,
  FileTextOutlined,
  OrderedListOutlined,
  PictureOutlined,
  RightOutlined,
  RocketOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';
import { useModel, useNavigate } from '@umijs/max';
import { listArticleUsingPost } from '@/services/backend/articleController';
import { formatDateShort } from '@/utils/date';
import './index.less';

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { initialState } = useModel('@@initialState');
  const currentUser = initialState?.currentUser;

  const [topic, setTopic] = useState('');
  const [recentArticles, setRecentArticles] = useState<API.ArticleVO[]>([]);
  const [loadingArticles, setLoadingArticles] = useState(false);

  const features = useMemo(
    () => [
      {
        icon: <FileTextOutlined />,
        title: '智能生成标题',
        description: 'AI 自动分析选题，生成吸引眼球的爆款标题',
        color: '#22C55E',
      },
      {
        icon: <OrderedListOutlined />,
        title: '自动生成大纲',
        description: '智能规划文章结构，确保逻辑清晰完整',
        color: '#3B82F6',
      },
      {
        icon: <EditOutlined />,
        title: '流式生成正文',
        description: '实时展示创作过程，体验打字机般的流畅输出',
        color: '#8B5CF6',
      },
      {
        icon: <PictureOutlined />,
        title: '智能配图',
        description: '自动检索高质量无版权图片，完美匹配内容',
        color: '#F59E0B',
      },
      {
        icon: <ThunderboltOutlined />,
        title: '快速高效',
        description: '5-10分钟完成全文创作，效率提升10倍',
        color: '#EF4444',
      },
      {
        icon: <ClockCircleOutlined />,
        title: '历史管理',
        description: '随时查看和管理所有创作记录，支持导出',
        color: '#06B6D4',
      },
    ],
    [],
  );

  const loadRecentArticles = async () => {
    if (!currentUser?.id) return;
    setLoadingArticles(true);
    try {
      const res = await listArticleUsingPost({ pageNum: 1, pageSize: 6 });
      const records = res?.data?.records || [];
      setRecentArticles(records);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('加载文章失败:', error);
    } finally {
      setLoadingArticles(false);
    }
  };

  useEffect(() => {
    loadRecentArticles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?.id]);

  const goToCreate = () => {
    if (topic.trim()) {
      navigate(`/create?topic=${encodeURIComponent(topic)}`);
    } else {
      navigate('/create');
    }
  };

  const goToList = () => {
    navigate('/article/list');
  };

  const viewArticle = (article: API.ArticleVO) => {
    navigate(`/article/${article.taskId}`);
  };

  return (
    <div id="homePage">
      <div className="hero-section">
        <div className="hero-bg" />
        <div className="container">
          <div className="hero-badge">
            <ThunderboltOutlined />
            <span>AI 驱动的内容创作平台</span>
          </div>
          <h1 className="hero-title">AI 爆款文章创作器</h1>
          <p className="hero-subtitle">让每个人都能写出 10万+ 文章</p>

          <div className="input-wrapper">
            <Input
              value={topic}
              onChange={(event) => setTopic(event.target.value)}
              placeholder="输入您想创作的文章选题，例如：2026年AI如何改变职场"
              size="large"
              className="topic-input"
              onPressEnter={goToCreate}
              prefix={<EditOutlined className="input-icon" />}
            />
            <Button type="primary" size="large" onClick={goToCreate} className="cta-btn">
              <RocketOutlined />
              开始创作
            </Button>
          </div>

          <p className="hero-tips">工作总结、心得体会、演讲稿、分析报告... 一键生成</p>
        </div>
      </div>

      <div className="features-section">
        <div className="container">
          <div className="section-header">
            <div className="section-badge">核心能力</div>
            <h2 className="section-title">专业人士的一站式AI写作工具</h2>
            <p className="section-subtitle">强大的 AI 能力，让创作变得简单高效</p>
          </div>
          <div className="features-grid">
            {features.map((feature, index) => (
              <div key={index} className="feature-card">
                <div className="feature-icon-wrapper" style={{ background: `${feature.color}15` }}>
                  <span className="feature-icon" style={{ color: feature.color }}>
                    {feature.icon}
                  </span>
                </div>
                <div className="feature-content">
                  <h3 className="feature-title">{feature.title}</h3>
                  <p className="feature-description">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {currentUser?.id && recentArticles.length > 0 && (
        <div className="articles-section">
          <div className="container">
            <div className="section-header-row">
              <div>
                <h2 className="section-title-sm">最近创作</h2>
                <p className="section-subtitle-sm">查看您最近创作的文章</p>
              </div>
              <Button type="link" onClick={goToList} className="view-all-btn">
                查看全部
                <RightOutlined />
              </Button>
            </div>

            {loadingArticles ? (
              <div className="articles-grid">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="article-card">
                    <Skeleton.Image active style={{ width: '100%', height: 140 }} />
                    <div style={{ padding: 16 }}>
                      <Skeleton active paragraph={{ rows: 2 }} />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="articles-grid">
                {recentArticles.map((article) => (
                  <div
                    key={article.id}
                    className="article-card"
                    onClick={() => viewArticle(article)}
                  >
                    <div className="article-cover">
                      {article.coverImage ? (
                        <img src={article.coverImage} alt={article.mainTitle} />
                      ) : (
                        <div className="cover-placeholder">
                          <FileTextOutlined />
                        </div>
                      )}
                    </div>
                    <div className="article-info">
                      <h4 className="article-title">{article.mainTitle || article.topic}</h4>
                      <div className="article-meta">
                        <span className="article-time">
                          <ClockCircleOutlined />
                          {formatDateShort(article.createTime || '')}
                        </span>
                        <span
                          className={`article-status status-${article.status?.toLowerCase()}`}
                        >
                          {article.status === 'COMPLETED'
                            ? '已完成'
                            : article.status === 'PROCESSING'
                            ? '生成中'
                            : '等待中'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default HomePage;

