/**
 * 权限判断工具
 */

import { USER_ROLE_ADMIN, USER_ROLE_VIP } from '@/constants/user';

export const isAdmin = (user?: API.LoginUserVO): boolean => {
  return user?.userRole === USER_ROLE_ADMIN;
};

export const isVip = (user?: API.LoginUserVO): boolean => {
  return user?.userRole === USER_ROLE_VIP || isAdmin(user);
};

/**
 * 所有已登录用户均有创作权限，不再限制配额
 */
export const hasQuota = (user?: API.LoginUserVO): boolean => {
  return !!user?.id;
};

