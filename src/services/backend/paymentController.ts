// @ts-ignore
/* eslint-disable */
import { request } from '@umijs/max';

/** 创建 VIP 支付会话 POST /api/payment/create-vip-session */
export async function createVipPaymentSessionUsingPost(options?: { [key: string]: any }) {
  return request<API.BaseResponseString>('/api/payment/create-vip-session', {
    method: 'POST',
    ...(options || {}),
  });
}

/** 获取当前用户支付记录 GET /api/payment/records */
export async function getPaymentRecordsUsingGet(options?: { [key: string]: any }) {
  return request<API.BaseResponseListPaymentRecord>('/api/payment/records', {
    method: 'GET',
    ...(options || {}),
  });
}

/** 申请退款 POST /api/payment/refund */
export async function refundUsingPost(
  params: API.refundParams,
  options?: { [key: string]: any },
) {
  return request<API.BaseResponseBoolean>('/api/payment/refund', {
    method: 'POST',
    params: {
      ...params,
    },
    ...(options || {}),
  });
}

