import React, { useMemo } from 'react';
import { Progress, Spin } from 'antd';
import { BulbOutlined, PictureOutlined } from '@ant-design/icons';
import { markdownToHtml } from '@/utils/markdown';
import './CreatingState.less';

interface OutlineItem {
  title: string;
  points: string[];
  section: number;
}

interface CreatingStateProps {
  article: Partial<API.ArticleVO>;
  outlineRaw: string;
  isOutlineStreaming: boolean;
  isStreaming: boolean;
  currentStep: number;
  imageCount: number;
  totalImages: number;
  imageProgress: number;
}

const CreatingState: React.FC<CreatingStateProps> = ({
  article,
  outlineRaw,
  isOutlineStreaming,
  isStreaming,
  currentStep,
  imageCount,
  totalImages,
  imageProgress,
}) => {
  const showImageProgress = currentStep === 4 && imageProgress > 0;
  const showLoadingPlaceholder = currentStep === 0 && !article.mainTitle;

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

  return (
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

      {showImageProgress && (
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

      {showLoadingPlaceholder && (
        <div className="loading-placeholder">
          <Spin size="large" />
          <p>AI 正在构思标题...</p>
        </div>
      )}
    </div>
  );
};

export default CreatingState;

