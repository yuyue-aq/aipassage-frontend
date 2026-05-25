// @ts-ignore
/* eslint-disable */
import { request } from '@umijs/max';

/** 获取系统统计数据 GET /api/statistics/overview */
export async function getStatisticsUsingGet(options?: { [key: string]: any }) {
  return request<API.BaseResponseStatisticsVO>('/api/statistics/overview', {
    method: 'GET',
    ...(options || {}),
  });
}

