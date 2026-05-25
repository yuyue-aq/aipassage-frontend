/**
 * 文章相关工具函数
 */
import { STATUS_COLOR_MAP, STATUS_TAG_COLOR_MAP, STATUS_TEXT_MAP } from '@/constants/article';

export const getStatusText = (status: string): string => {
  return STATUS_TEXT_MAP[status] || status;
};

export const getStatusTagColor = (status: string): string => {
  return STATUS_TAG_COLOR_MAP[status] || 'default';
};

export const getStatusColor = (status: string): string => {
  return STATUS_COLOR_MAP[status] || '#999';
};

export interface ExportArticleOptions {
  title: string;
  subTitle?: string;
  content?: string;
  fullContent?: string;
  outline?: Array<{ section: number; title: string }>;
  images?: Array<{ description: string; url: string }>;
}

export const exportAsMarkdown = (options: ExportArticleOptions): void => {
  const { title, subTitle, content, fullContent, outline, images } = options;

  let markdown = `# ${title}\n\n`;
  if (subTitle) {
    markdown += `> ${subTitle}\n\n`;
  }

  if (fullContent) {
    markdown += fullContent;
  } else {
    if (outline && outline.length > 0) {
      markdown += `## 目录\n\n`;
      outline.forEach((item) => {
        markdown += `${item.section}. ${item.title}\n`;
      });
      markdown += `\n---\n\n`;
    }

    markdown += content || '';

    if (images && images.length > 0) {
      markdown += `\n\n## 配图\n\n`;
      images.forEach((image) => {
        markdown += `![${image.description}](${image.url})\n\n`;
      });
    }
  }

  const blob = new Blob([markdown], { type: 'text/markdown' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `${title || '文章'}.md`;
  anchor.click();
  URL.revokeObjectURL(url);
};

