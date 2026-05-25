import React from 'react';
import { CheckCircleFilled } from '@ant-design/icons';
import { markdownToHtml } from '@/utils/markdown';
import './CompletedState.less';

interface CompletedStateProps {
  article: Partial<API.ArticleVO>;
}

const CompletedState: React.FC<CompletedStateProps> = ({ article }) => {
  return (
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
  );
};

export default CompletedState;

