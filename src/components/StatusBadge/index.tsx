import React, { useMemo } from 'react';
import { getStatusText } from '@/utils/article';
import './index.less';

interface StatusBadgeProps {
  status: string;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const statusText = useMemo(() => getStatusText(status), [status]);

  return (
    <span className={`status-badge status-${status?.toLowerCase()}`}>
      <span className="status-dot" />
      {statusText}
    </span>
  );
};

export default StatusBadge;

