// @ts-ignore
/* eslint-disable */
import { request } from '@umijs/max';

/** 获取文章详情 GET /api/article/${param0} */
export async function getArticleUsingGet(
  params: API.getArticleParams,
  options?: { [key: string]: any },
) {
  const { taskId: param0, ...queryParams } = params;
  return request<API.BaseResponseArticleVO>(`/api/article/${param0}`, {
    method: 'GET',
    params: { ...queryParams },
    ...(options || {}),
  });
}

/** AI 修改大纲 POST /api/article/ai-modify-outline */
export async function aiModifyOutlineUsingPost(
  body: API.ArticleAiModifyOutlineRequest,
  options?: { [key: string]: any },
) {
  return request<API.BaseResponseListOutlineSection>('/api/article/ai-modify-outline', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  });
}

/** 确认大纲 POST /api/article/confirm-outline */
export async function confirmOutlineUsingPost(
  body: API.ArticleConfirmOutlineRequest,
  options?: { [key: string]: any },
) {
  return request<API.BaseResponseVoid>('/api/article/confirm-outline', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  });
}

/** 确认标题并输入补充描述 POST /api/article/confirm-title */
export async function confirmTitleUsingPost(
  body: API.ArticleConfirmTitleRequest,
  options?: { [key: string]: any },
) {
  return request<API.BaseResponseVoid>('/api/article/confirm-title', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  });
}

/** 创建文章任务 POST /api/article/create */
export async function createArticleUsingPost(
  body: API.ArticleCreateRequest,
  options?: { [key: string]: any },
) {
  return request<API.BaseResponseString>('/api/article/create', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  });
}

/** 删除文章 POST /api/article/delete */
export async function deleteArticleUsingPost(body: API.DeleteRequest, options?: { [key: string]: any }) {
  return request<API.BaseResponseBoolean>('/api/article/delete', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  });
}

/** 获取任务执行日志 GET /api/article/execution-logs/${param0} */
export async function getExecutionLogsUsingGet(
  params: API.getExecutionLogsParams,
  options?: { [key: string]: any },
) {
  const { taskId: param0, ...queryParams } = params;
  return request<API.BaseResponseAgentExecutionStats>(`/api/article/execution-logs/${param0}`, {
    method: 'GET',
    params: { ...queryParams },
    ...(options || {}),
  });
}

/** 分页查询文章列表 POST /api/article/list */
export async function listArticleUsingPost(
  body: API.ArticleQueryRequest,
  options?: { [key: string]: any },
) {
  return request<API.BaseResponsePageArticleVO>('/api/article/list', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  });
}

/** 获取文章生成进度(SSE) GET /api/article/progress/${param0} */
export async function getProgressUsingGet(
  params: API.getProgressParams,
  options?: { [key: string]: any },
) {
  const { taskId: param0, ...queryParams } = params;
  return request<API.SseEmitter>(`/api/article/progress/${param0}`, {
    method: 'GET',
    params: { ...queryParams },
    ...(options || {}),
  });
}

