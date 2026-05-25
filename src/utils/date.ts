/**
 * 日期工具函数
 */
import dayjs from 'dayjs';

export const formatDate = (date: string | number, format = 'YYYY-MM-DD HH:mm'): string => {
  return dayjs(date).format(format);
};

export const formatDateShort = (date: string | number): string => {
  return formatDate(date, 'MM-DD HH:mm');
};

export const formatDateFull = (date: string | number): string => {
  return formatDate(date, 'YYYY-MM-DD HH:mm:ss');
};

