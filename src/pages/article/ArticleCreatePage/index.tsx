import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  BarChartOutlined,
  BulbOutlined,
  CheckCircleFilled,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CopyOutlined,
  EyeOutlined,
  FileTextOutlined,
  InfoCircleOutlined,
  LoadingOutlined,
  PictureOutlined,
  RedoOutlined,
  RocketOutlined,
  StarOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';
import {
  Button,
  Checkbox,
  Input,
  Modal,
  Progress,
  Radio,
  Skeleton,
  Spin,
  message,
} from 'antd';
import { useLocation, useModel, useNavigate } from '@umijs/max';
import { connectSSE, closeSSE, type SSEMessage } from '@/utils/sse';
import { isAdmin as checkIsAdmin } from '@/utils/permission';
import { markdownToHtml } from '@/utils/markdown';
import { createArticleUsingPost, confirmOutlineUsingPost, confirmTitleUsingPost } from '@/services/backend/articleController';
import TitleSelectingStage from '../components/TitleSelectingStage';
import OutlineEditingStage from '../components/OutlineEditingStage';
import './index.less';

interface RealtimeLog {
  timestamp: number;
  level: string;
  message: string;
}

interface OutlineItem {
  title: string;
  points: string[];
  section: number;
}

const ArticleCreatePage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { initialState } = useModel('@@initialState');
  const currentUser = initialState?.currentUser;

  const isAdmin = useMemo(() => checkIsAdmin(currentUser), [currentUser]);

  const agentSteps = useMemo(
    () => [
      { title: '生成标题', description: 'AI 分析选题，生成吸睛标题' },
      { title: '规划大纲', description: '构建文章结构，理清脉络' },
      { title: '撰写正文', description: '流式生成高质量文章内容' },
      { title: '分析配图', description: '智能分析配图需求和位置' },
      { title: '生成配图', description: '自动匹配高清无版权图片' },
      { title: '图文合成', description: '将配图插入正文，完美呈现' },
    ],
    [],
  );

  const exampleTopics = useMemo(
    () => ['2026年AI如何改变职场', '程序员如何提升竞争力', '远程办公的利与弊', '如何培养深度思考', '新能源汽车趋势', '健康饮食指南'],
    [],
  );

  const [currentPhase, setCurrentPhase] = useState('INPUT');
  const [topic, setTopic] = useState('');
  const [selectedStyle, setSelectedStyle] = useState('');
  const [selectedImageMethods, setSelectedImageMethods] = useState<string[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isOutlineStreaming, setIsOutlineStreaming] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [taskId, setTaskId] = useState('');
  const [errorVisible, setErrorVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [realtimeLogs, setRealtimeLogs] = useState<RealtimeLog[]>([]);
  const [titleOptions, setTitleOptions] = useState<Array<{ mainTitle: string; subTitle: string }>>([]);
  const [outline, setOutline] = useState<Array<{ section: number; title: string; points: string[] }>>([]);
  const [outlineRaw, setOutlineRaw] = useState('');
  const [imageCount, setImageCount] = useState(0);
  const [totalImages, setTotalImages] = useState(5);
  const [imageProgress, setImageProgress] = useState(0);
  const [article, setArticle] = useState<Partial<API.ArticleVO>>({
    mainTitle: '',
    subTitle: '',
    content: '',
    fullContent: '',
    images: [],
  });

  const mainContentRef = useRef<HTMLDivElement | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const hasReceivedSseRef = useRef(false);

  const scrollToBottom = () => {
    if (mainContentRef.current) {
      mainContentRef.current.scrollTop = mainContentRef.current.scrollHeight;
    }
  };

  const addLog = (logMessage: string, level: string = 'info') => {
    setRealtimeLogs((prev) => {
      const next = [...prev, { timestamp: Date.now(), level, message: logMessage }];
      return next.length > 50 ? next.slice(next.length - 50) : next;
    });
  };

  const formatLogTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('zh-CN', { hour12: false });
  };

  const parsedOutline = useMemo<OutlineItem[]>(() => {
    if (!outlineRaw) return [];
    const str = outlineRaw.trim();
    try {
      const parsed = JSON.parse(str);
      if (parsed && Array.isArray(parsed.sections)) {
        return parsed.sections;
      }
      return [];
    } catch {
      try {
        const sectionsMatch = str.match(/"sections"\s*:\s*\[/);
        if (!sectionsMatch) return [];
        const sectionsStart = str.indexOf('[', sectionsMatch.index);
        if (sectionsStart === -1) return [];
        const afterStart = str.substring(sectionsStart);
        const lastBrace = afterStart.lastIndexOf('}');
        if (lastBrace > 0) {
          const partialArray = `${afterStart.substring(0, lastBrace + 1)}]`;
          const parsed = JSON.parse(partialArray);
          if (Array.isArray(parsed)) {
            return parsed;
          }
        }
        return [];
      } catch {
        return [];
      }
    }
  }, [outlineRaw]);

  const handleSSEMessage = (msg: SSEMessage) => {
    hasReceivedSseRef.current = true;
    switch (msg.type) {
      case 'AGENT1_COMPLETE':
        setCurrentPhase('TITLE_GENERATING');
        setCurrentStep(1);
        addLog('智能体1：标题方案生成完成', 'success');
        break;
      case 'TITLES_GENERATED':
        setCurrentPhase('TITLE_SELECTING');
        setTitleOptions(msg.titleOptions || []);
        setIsCreating(false);
        addLog(`生成了 ${msg.titleOptions?.length || 0} 个标题方案`, 'success');
        break;
      case 'AGENT2_STREAMING':
        setCurrentPhase('OUTLINE_GENERATING');
        setIsCreating(true);
        setIsOutlineStreaming(true);
        setOutlineRaw((prev) => prev + (msg.content || ''));
        scrollToBottom();
        break;
      case 'OUTLINE_GENERATED':
        setCurrentPhase('OUTLINE_EDITING');
        setOutline(msg.outline || []);
        setIsCreating(false);
        setIsOutlineStreaming(false);
        addLog('大纲生成完成，等待确认', 'success');
        break;
      case 'AGENT3_STREAMING':
        setCurrentPhase('CONTENT_GENERATING');
        setIsCreating(true);
        setCurrentStep(2);
        setIsStreaming(true);
        setArticle((prev) => ({
          ...prev,
          content: `${prev.content || ''}${msg.content || ''}`,
        }));
        scrollToBottom();
        break;
      case 'AGENT3_COMPLETE':
        setIsCreating(true);
        setIsStreaming(false);
        setCurrentStep(3);
        addLog('正文生成完成，开始分析配图', 'success');
        break;
      case 'AGENT4_COMPLETE':
        setIsCreating(true);
        setCurrentStep(4);
        setTotalImages(msg.imageRequirements?.length || 5);
        addLog(`配图需求分析完成，共 ${msg.imageRequirements?.length || 5} 张`, 'success');
        break;
      case 'IMAGE_COMPLETE':
        setImageCount((prev) => {
          const next = prev + 1;
          setImageProgress(Math.round((next / totalImages) * 100));
          return next;
        });
        addLog(`配图生成中 ${imageCount + 1}/${totalImages}`, 'info');
        break;
      case 'AGENT5_COMPLETE':
        setIsCreating(true);
        setCurrentStep(5);
        setArticle((prev) => ({
          ...prev,
          images: msg.images,
        }));
        addLog('所有配图生成完成', 'success');
        break;
      case 'MERGE_COMPLETE':
        setArticle((prev) => ({
          ...prev,
          fullContent: msg.fullContent,
        }));
        scrollToBottom();
        addLog('图文合成完成', 'success');
        break;
      case 'ALL_COMPLETE':
        setCurrentPhase('COMPLETED');
        setCurrentStep(6);
        setIsCompleted(true);
        setIsCreating(false);
        setIsStreaming(false);
        message.success('文章创作完成!');
        addLog('✨ 文章创作完成！', 'success');
        break;
      case 'ERROR':
        setErrorMessage(msg.message || '创作失败');
        setErrorVisible(true);
        setIsCreating(false);
        setCurrentPhase('INPUT');
        addLog(`创作失败: ${msg.message || '未知错误'}`, 'error');
        break;
      default:
        console.log('[SSE] 未处理的消息类型:', msg.type, msg);
        break;
    }
  };

  const handleSSEError = () => {
    message.error('连接失败,请重试');
    setIsCreating(false);
  };

  const startCreate = async () => {
    if (!topic.trim()) {
      message.warning('请输入选题');
      return;
    }
    setIsCreating(true);
    setCurrentStep(0);
    setRealtimeLogs([]);
    hasReceivedSseRef.current = false;
    addLog('开始创建文章任务...', 'info');

    try {
      const res = await createArticleUsingPost({
        topic,
        style: selectedStyle || undefined,
        enabledImageMethods: selectedImageMethods.length > 0 ? selectedImageMethods : undefined,
      });
      const newTaskId = res?.data;
      if (!newTaskId) {
        throw new Error('创建任务失败：未返回任务ID');
      }
      setTaskId(newTaskId);
      addLog(`任务创建成功，ID: ${newTaskId}`, 'success');
      addLog('已建立实时连接，开始生成...', 'info');

      eventSourceRef.current = connectSSE(newTaskId, {
        onMessage: handleSSEMessage,
        onError: handleSSEError,
        onComplete: () => null,
      });
    } catch (error: any) {
      message.error(error?.message || '创建任务失败');
      setIsCreating(false);
    }
  };

  const handleConfirmTitle = async (data: { mainTitle: string; subTitle: string; userDescription: string }) => {
    setConfirmLoading(true);
    try {
      await confirmTitleUsingPost({
        taskId,
        selectedMainTitle: data.mainTitle,
        selectedSubTitle: data.subTitle,
        userDescription: data.userDescription,
      });
      setArticle((prev) => ({
        ...prev,
        mainTitle: data.mainTitle,
        subTitle: data.subTitle,
      }));
      message.success('标题已确认，正在生成大纲...');
    } catch (error: any) {
      message.error(error?.message || '确认标题失败');
    } finally {
      setConfirmLoading(false);
    }
  };

  const handleConfirmOutline = async (outlineData: Array<{ section: number; title: string; points: string[] }>) => {
    setConfirmLoading(true);
    setIsCreating(true);
    try {
      await confirmOutlineUsingPost({
        taskId,
        outline: outlineData,
      });
      setOutlineRaw(JSON.stringify({ sections: outlineData }));
      message.success('大纲已确认，正在生成正文...');
    } catch (error: any) {
      setIsCreating(false);
      message.error(error?.message || '确认大纲失败');
    } finally {
      setConfirmLoading(false);
    }
  };

  const copyContent = async () => {
    const content = article.fullContent || article.content || '';
    try {
      await navigator.clipboard.writeText(content);
      message.success('已复制到剪贴板');
    } catch {
      message.error('复制失败');
    }
  };

  const viewArticle = () => {
    navigate(`/article/${taskId}`);
  };

  const resetCreate = () => {
    setCurrentPhase('INPUT');
    setTopic('');
    setSelectedStyle('');
    setSelectedImageMethods([]);
    setTitleOptions([]);
    setOutline([]);
    setIsCreating(false);
    setIsCompleted(false);
    setIsStreaming(false);
    setIsOutlineStreaming(false);
    setCurrentStep(0);
    setImageCount(0);
    setImageProgress(0);
    setOutlineRaw('');
    setConfirmLoading(false);
    setRealtimeLogs([]);
    setArticle({
      mainTitle: '',
      subTitle: '',
      content: '',
      fullContent: '',
      images: [],
    });
  };

  const applyPhaseFromServer = (phase?: string) => {
    switch (phase) {
      case 'TITLE_GENERATING':
        setCurrentPhase('TITLE_GENERATING');
        setCurrentStep(0);
        setIsCreating(true);
        break;
      case 'TITLE_SELECTING':
        setCurrentPhase('TITLE_SELECTING');
        setCurrentStep(1);
        setIsCreating(false);
        break;
      case 'OUTLINE_GENERATING':
        setCurrentPhase('OUTLINE_GENERATING');
        setCurrentStep(1);
        setIsCreating(true);
        break;
      case 'OUTLINE_EDITING':
        setCurrentPhase('OUTLINE_EDITING');
        setCurrentStep(1);
        setIsCreating(false);
        break;
      case 'CONTENT_GENERATING':
        setCurrentPhase('CONTENT_GENERATING');
        setCurrentStep(2);
        setIsCreating(true);
        break;
      case 'IMAGE_ANALYZING':
      case 'IMAGE_GENERATING':
      case 'MERGE_CONTENT':
        setCurrentPhase('CONTENT_GENERATING');
        setCurrentStep(4);
        setIsCreating(true);
        break;
      case 'COMPLETED':
      case 'ALL_COMPLETE':
        setCurrentPhase('COMPLETED');
        setCurrentStep(6);
        setIsCompleted(true);
        setIsCreating(false);
        setIsStreaming(false);
        setIsOutlineStreaming(false);
        break;
      default:
        break;
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const queryTopic = params.get('topic');
    if (queryTopic) {
      setTopic(queryTopic);
    }
  }, [location.search]);

  useEffect(() => {
    return () => {
      closeSSE(eventSourceRef.current);
    };
  }, []);

  return (
    <div className="article-create-page">
      <div className="create-layout">
        <aside className="sidebar-left">
          <div className="sidebar-header">
            <h3 className="sidebar-title">创作流程</h3>
            <p className="sidebar-subtitle">智能体协作可视化</p>
          </div>

          <div className="flow-timeline">
            {agentSteps.map((step, index) => (
              <div
                key={step.title}
                className={`flow-item ${currentStep === index ? 'active' : currentStep > index ? 'completed' : 'pending'}`}
              >
                <div className="flow-indicator">
                  {currentStep === index && isCreating ? (
                    <LoadingOutlined className="spin-icon" />
                  ) : currentStep > index ? (
                    <CheckCircleOutlined />
                  ) : (
                    <span className="step-number">{index + 1}</span>
                  )}
                </div>
                <div className="flow-content">
                  <div className="flow-title">{step.title}</div>
                  <div className="flow-desc">{step.description}</div>
                  {currentStep === index && isCreating && (
                    <div className="flow-status">
                      <span className="status-dot" />
                      执行中...
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </aside>

        <main ref={mainContentRef} className="main-content">
          {currentPhase === 'INPUT' && (
            <div className="input-state">
              <div className="input-card">
                <div className="input-header">
                  <h1 className="input-title">创作新文章</h1>
                  <p className="input-subtitle">输入选题，AI 帮你生成爆款文章</p>
                </div>

                <div className="input-area">
                  <Input.TextArea
                    value={topic}
                    onChange={(event) => setTopic(event.target.value)}
                    placeholder="请输入您想创作的文章选题，例如：2026年AI如何改变职场"
                    rows={6}
                    maxLength={500}
                    showCount
                    className="topic-textarea"
                  />

                  <div className="style-section">
                    <div className="section-header">
                      <span className="section-title">文章风格</span>
                      <span className="section-tip">（不选择使用默认风格）</span>
                    </div>
                    <Radio.Group value={selectedStyle} onChange={(e) => setSelectedStyle(e.target.value)} className="style-group">
                      <Radio value="">默认</Radio>
                      <Radio value="tech">科技风格</Radio>
                      <Radio value="emotional">情感风格</Radio>
                      <Radio value="educational">教育风格</Radio>
                      <Radio value="humorous">轻松幽默</Radio>
                    </Radio.Group>
                  </div>

                  <div className="image-methods-section">
                    <div className="section-header">
                      <span className="section-title">配图方式</span>
                      <span className="section-tip">（不选择表示支持所有方式）</span>
                    </div>
                    <Checkbox.Group
                      value={selectedImageMethods}
                      onChange={(values) => setSelectedImageMethods(values as string[])}
                      className="methods-group"
                    >
                      <Checkbox value="PEXELS">Pexels（免费图片素材）</Checkbox>
                      <Checkbox value="NANO_BANANA">Nano Banana（AI生成图片）</Checkbox>
                      <Checkbox value="MERMAID">Mermaid（画图表）</Checkbox>
                      <Checkbox value="ICONIFY">Iconify（图标素材）</Checkbox>
                      <Checkbox value="EMOJI_PACK">表情包（趣味表情）</Checkbox>
                      <Checkbox value="SVG_DIAGRAM">SVG（矢量图）</Checkbox>
                    </Checkbox.Group>
                  </div>

                  <Button
                    type="primary"
                    size="large"
                    loading={isCreating}
                    disabled={!topic.trim()}
                    onClick={startCreate}
                    className="create-btn"
                  >
                    <RocketOutlined />
                    开始创作
                  </Button>
                </div>
              </div>
            </div>
          )}

          {currentPhase === 'TITLE_GENERATING' && (
            <div className="loading-stage">
              <Skeleton active paragraph={{ rows: 1 }} />
              <Skeleton active paragraph={{ rows: 1 }} />
              <Skeleton active paragraph={{ rows: 1 }} />
              <h3>AI 正在生成标题方案...</h3>
              <p>稍等片刻，即将为您呈现多个精彩标题</p>
            </div>
          )}

          {currentPhase === 'TITLE_SELECTING' && (
            <TitleSelectingStage titleOptions={titleOptions} loading={confirmLoading} onConfirm={handleConfirmTitle} />
          )}

          {currentPhase === 'OUTLINE_GENERATING' && (
            <div className="outline-generating-state">
              {article.mainTitle && (
                <div className="preview-header">
                  <h1 className="article-title">{article.mainTitle}</h1>
                  <p className="article-subtitle">{article.subTitle}</p>
                </div>
              )}
              <div className="outline-preview">
                <div className="section-label">
                  <BulbOutlined />
                  <span>AI 正在规划文章大纲</span>
                  <span className="typing-cursor">|</span>
                </div>
                {parsedOutline.length > 0 ? (
                  <div className="outline-list">
                    {parsedOutline.map((item) => (
                      <div key={item.section} className="outline-item fade-in">
                        <div className="outline-title">
                          {item.section}. {item.title}
                        </div>
                        <ul className="outline-points">
                          {item.points.map((point, idx) => (
                            <li key={idx}>{point}</li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="outline-loading">
                    <Skeleton active paragraph={{ rows: 2 }} />
                    <span>正在构建文章结构...</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {currentPhase === 'OUTLINE_EDITING' && (
            <OutlineEditingStage outline={outline} loading={confirmLoading} taskId={taskId} onConfirm={handleConfirmOutline} />
          )}

          {currentPhase === 'CONTENT_GENERATING' && (
            <div className="creating-state">
              {article.mainTitle && (
                <div className="preview-header">
                  <h1 className="article-title">{article.mainTitle}</h1>
                  <p className="article-subtitle">{article.subTitle}</p>
                </div>
              )}

              {outlineRaw && (
                <div className="outline-preview">
                  <div className="section-label">
                    <BulbOutlined />
                    <span>文章大纲</span>
                    {isOutlineStreaming && <span className="typing-cursor">|</span>}
                  </div>
                  <div className="outline-list">
                    {parsedOutline.map((item) => (
                      <div key={item.section} className="outline-item">
                        <div className="outline-title">
                          {item.section}. {item.title}
                        </div>
                        <ul className="outline-points">
                          {item.points.map((point, idx) => (
                            <li key={idx}>{point}</li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {article.content && (
                <div className="content-preview">
                  <div
                    className="markdown-body"
                    dangerouslySetInnerHTML={{ __html: markdownToHtml(article.content || '') }}
                  />
                  {isStreaming && <span className="typing-cursor">|</span>}
                </div>
              )}

              {currentStep === 3 && isCreating && (
                <div className="image-progress-box">
                  <div className="progress-header">
                    <PictureOutlined />
                    <span>正在分析配图需求...</span>
                  </div>
                  <Spin />
                  <p className="progress-hint">
                    AI 正在为文章匹配合适的配图位置和类型
                  </p>
                </div>
              )}

              {currentStep === 4 && imageProgress > 0 && (
                <div className="image-progress-box">
                  <div className="progress-header">
                    <PictureOutlined />
                    <span>正在生成配图</span>
                  </div>
                  <Progress percent={imageProgress} status="active" strokeColor={{ from: '#22C55E', to: '#16A34A' }} />
                  <p className="progress-hint">
                    {imageCount}/{totalImages} 张图片已完成
                  </p>
                </div>
              )}

              {currentStep >= 3 && currentStep < 6 && isCreating && (
                <div className="patience-notice">
                  <div className="patience-header">
                    <ClockCircleOutlined />
                    <span>添加配图步骤时间较长，请耐心等待</span>
                  </div>
                  <p className="patience-desc">
                    图片的生成与分析需要一定时间，可以去生成其他文章呦～当前任务会在后台继续执行。
                  </p>
                  <Button
                    type="primary"
                    ghost
                    icon={<RocketOutlined />}
                    onClick={resetCreate}
                    className="new-article-btn"
                  >
                    创建新文章
                  </Button>
                </div>
              )}

              {currentStep === 0 && !article.mainTitle && (
                <div className="loading-placeholder">
                  <Spin size="large" />
                  <p>AI 正在构思标题...</p>
                </div>
              )}
            </div>
          )}

          {currentPhase === 'COMPLETED' && (
            <div className="completed-state">
              <div className="success-header">
                <CheckCircleFilled className="success-icon" />
                <span>文章创作完成！</span>
              </div>
              <div className="preview-header">
                <h1 className="article-title">{article.mainTitle}</h1>
                <p className="article-subtitle">{article.subTitle}</p>
              </div>
              <div className="content-preview">
                <div
                  className="markdown-body"
                  dangerouslySetInnerHTML={{ __html: markdownToHtml(article.fullContent || article.content || '') }}
                />
              </div>
            </div>
          )}
        </main>

        <aside className="sidebar-right">
          {currentPhase === 'INPUT' && (
            <div className="panel-section quota-section">
              <h4 className="panel-title">
                <RocketOutlined />
                创作权限
              </h4>
              {isAdmin && (
                <div className="quota-admin">
                  <span className="quota-badge admin">管理员</span>
                  <span className="quota-text">无限次</span>
                </div>
              )}
              {!isAdmin && (
                <div className="quota-admin">
                  <span className="quota-badge user">注册用户</span>
                  <span className="quota-text">无限制</span>
                </div>
              )}
            </div>
          )}

          {currentPhase === 'INPUT' && (
            <div className="panel-section">
              <h4 className="panel-title">
                <BulbOutlined />
                热门选题
              </h4>
              <div className="hot-tags">
                {exampleTopics.map((example) => (
                  <span key={example} className="hot-tag" onClick={() => setTopic(example)}>
                    {example}
                  </span>
                ))}
              </div>
            </div>
          )}

          {currentPhase === 'INPUT' && (
            <div className="panel-section">
              <h4 className="panel-title">
                <StarOutlined />
                爆款技巧
              </h4>
              <div className="tips-list">
                <div className="tip-item">
                  <div className="tip-icon">1</div>
                  <div className="tip-content">
                    <div className="tip-title">抓住痛点</div>
                    <div className="tip-desc">直击用户最关心的问题</div>
                  </div>
                </div>
                <div className="tip-item">
                  <div className="tip-icon">2</div>
                  <div className="tip-content">
                    <div className="tip-title">制造悬念</div>
                    <div className="tip-desc">让读者产生好奇心</div>
                  </div>
                </div>
                <div className="tip-item">
                  <div className="tip-icon">3</div>
                  <div className="tip-content">
                    <div className="tip-title">数字吸引</div>
                    <div className="tip-desc">使用具体数据增加说服力</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {(isCreating || currentPhase === 'TITLE_SELECTING' || currentPhase === 'OUTLINE_EDITING') && (
            <div className="panel-section">
              <h4 className="panel-title">
                <ClockCircleOutlined />
                创作进度
              </h4>
              <div className="progress-info">
                <div className="progress-step">
                  <span className="step-label">当前步骤</span>
                  <span className="step-value">{agentSteps[currentStep]?.title}</span>
                </div>
                <div className="progress-step">
                  <span className="step-label">已完成</span>
                  <span className="step-value">
                    {currentStep}/{agentSteps.length}
                  </span>
                </div>
              </div>
              {isCreating ? (
                <div className="progress-tip">
                  <InfoCircleOutlined />
                  <span>AI 正在努力创作中，请耐心等待...</span>
                </div>
              ) : (
                <div className="progress-tip waiting">
                  <InfoCircleOutlined />
                  <span>等待您的确认...</span>
                </div>
              )}
            </div>
          )}

          {realtimeLogs.length > 0 && (
            <div className="panel-section realtime-logs-section">
              <h4 className="panel-title">
                <FileTextOutlined />
                执行日志
              </h4>
              <div className="logs-container">
                {realtimeLogs.map((log, index) => (
                  <div key={`${log.timestamp}-${index}`} className={`log-entry ${log.level}`}>
                    <span className="log-time">{formatLogTime(log.timestamp)}</span>
                    <span className="log-message">{log.message}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {currentPhase !== 'INPUT' && currentPhase !== 'COMPLETED' && topic && (
            <div className="panel-section">
              <h4 className="panel-title">
                <BulbOutlined />
                创作选题
              </h4>
              <div className="topic-display">
                <p>{topic}</p>
              </div>
            </div>
          )}

          {currentPhase === 'TITLE_GENERATING' && (
            <div className="panel-section tips-section">
              <h4 className="panel-title">
                <StarOutlined />
                提示
              </h4>
              <div className="tips-list">
                <div className="tip-item">
                  <div className="tip-icon">💡</div>
                  <div className="tip-content">
                    <div className="tip-desc">AI 正在分析您的选题，生成多个吸引眼球的标题方案</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {currentPhase === 'TITLE_SELECTING' && (
            <div className="panel-section tips-section">
              <h4 className="panel-title">
                <StarOutlined />
                提示
              </h4>
              <div className="tips-list">
                <div className="tip-item">
                  <div className="tip-icon">✅</div>
                  <div className="tip-content">
                    <div className="tip-desc">选择最符合您期望的标题，或添加补充描述让 AI 更好地理解您的需求</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {currentPhase === 'OUTLINE_GENERATING' && (
            <div className="panel-section tips-section">
              <h4 className="panel-title">
                <StarOutlined />
                提示
              </h4>
              <div className="tips-list">
                <div className="tip-item">
                  <div className="tip-icon">📝</div>
                  <div className="tip-content">
                    <div className="tip-desc">AI 正在为您规划文章结构，构建清晰的章节脉络</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {currentPhase === 'OUTLINE_EDITING' && (
            <div className="panel-section tips-section">
              <h4 className="panel-title">
                <StarOutlined />
                编辑技巧
              </h4>
              <div className="tips-list">
                <div className="tip-item">
                  <div className="tip-icon">1</div>
                  <div className="tip-content">
                    <div className="tip-title">拖动排序</div>
                    <div className="tip-desc">点击章节左侧拖动图标可调整章节顺序</div>
                  </div>
                </div>
                <div className="tip-item">
                  <div className="tip-icon">2</div>
                  <div className="tip-content">
                    <div className="tip-title">AI 助手</div>
                    <div className="tip-desc">使用 AI 助手快速修改大纲结构</div>
                  </div>
                </div>
                <div className="tip-item">
                  <div className="tip-icon">3</div>
                  <div className="tip-content">
                    <div className="tip-title">添加章节</div>
                    <div className="tip-desc">根据需要添加或删除章节和要点</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {currentPhase === 'COMPLETED' && (
            <>
              <div className="panel-section">
                <h4 className="panel-title">
                  <ThunderboltOutlined />
                  快捷操作
                </h4>
                <div className="action-list">
                  <Button block onClick={copyContent} className="action-btn">
                    <CopyOutlined />
                    复制全文
                  </Button>
                  <Button block onClick={viewArticle} className="action-btn">
                    <EyeOutlined />
                    查看详情
                  </Button>
                  <Button block type="primary" onClick={resetCreate} className="action-btn primary">
                    <RedoOutlined />
                    再创作一篇
                  </Button>
                </div>
              </div>

              <div className="panel-section stats-section">
                <h4 className="panel-title">
                  <BarChartOutlined />
                  文章统计
                </h4>
                <div className="stats-grid">
                  <div className="stat-item">
                    <div className="stat-value">{(article.fullContent || article.content || '').length}</div>
                    <div className="stat-label">字数</div>
                  </div>
                  <div className="stat-item">
                    <div className="stat-value">{article.images?.length || 0}</div>
                    <div className="stat-label">配图</div>
                  </div>
                </div>
              </div>
            </>
          )}

        </aside>
      </div>

      <Modal open={errorVisible} title="创作失败" onOk={() => setErrorVisible(false)} onCancel={() => setErrorVisible(false)}>
        <p>{errorMessage}</p>
      </Modal>
    </div>
  );
};

export default ArticleCreatePage;

