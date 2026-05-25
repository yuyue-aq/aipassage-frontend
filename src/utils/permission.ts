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

export const hasQuota = (user?: API.LoginUserVO): boolean => {
  if (isAdmin(user) || isVip(user)) {
    return true;
  }
  return (user?.quota ?? 0) > 0;
};

