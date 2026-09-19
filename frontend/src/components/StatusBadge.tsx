import React from 'react';

interface StatusBadgeProps {
  status: string;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const getBadgeClass = (st: string) => {
    switch (st?.toUpperCase()) {
      case 'APPROVED':
      case 'PAID':
      case 'ACTIVE':
      case 'ISSUED':
      case 'AWARDED':
      case 'OPEN':
      case 'PUBLISHED':
        return 'badge-green';

      case 'PENDING':
      case 'AWAITING_APPROVAL':
      case 'PENDING_REVIEW':
      case 'SUBMITTED':
      case 'SHORTLISTED':
        return 'badge-yellow';

      case 'DRAFT':
      case 'INVITED':
        return 'badge-blue';

      case 'REJECTED':
      case 'CANCELLED':
      case 'BLACKLISTED':
      case 'REVOKED':
      case 'EXPIRED':
        return 'badge-red';

      case 'SUSPENDED':
      case 'WITHDRAWN':
      case 'OVERDUE':
        return 'badge-orange';

      case 'CLOSED':
      case 'FULFILLED':
      default:
        return 'badge-gray';
    }
  };

  return (
    <span className={`badge ${getBadgeClass(status)}`}>
      {status ? status.replace(/_/g, ' ') : 'UNKNOWN'}
    </span>
  );
}
