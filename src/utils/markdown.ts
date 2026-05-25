/**
 * Markdown 工具函数
 */
import { marked } from 'marked';

export const markdownToHtml = (markdown: string): string => {
  return marked(markdown) as string;
};

