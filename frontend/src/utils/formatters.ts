// Utility functions for formatting data

export const formatCurrency = (value: number, currency: string = 'USD'): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};

export const formatPercentage = (value: number, decimals: number = 2): string => {
  return `${(value * 100).toFixed(decimals)}%`;
};

export const formatNumber = (value: number, decimals: number = 2): string => {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
};

export const formatLargeNumber = (value: number): string => {
  if (value >= 1e9) {
    return `${(value / 1e9).toFixed(1)}B`;
  } else if (value >= 1e6) {
    return `${(value / 1e6).toFixed(1)}M`;
  } else if (value >= 1e3) {
    return `${(value / 1e3).toFixed(1)}K`;
  }
  return value.toFixed(0);
};

export const formatAddress = (address: string, startChars: number = 6, endChars: number = 4): string => {
  if (address.length <= startChars + endChars) {
    return address;
  }
  return `${address.slice(0, startChars)}...${address.slice(-endChars)}`;
};

export const formatHash = (hash: string, startChars: number = 8, endChars: number = 6): string => {
  if (hash.length <= startChars + endChars) {
    return hash;
  }
  return `${hash.slice(0, startChars)}...${hash.slice(-endChars)}`;
};

export const formatDate = (date: string | Date): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);
};

export const formatRelativeTime = (date: string | Date): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - d.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return 'Just now';
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
  } else if (diffInSeconds < 2592000) {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days} day${days !== 1 ? 's' : ''} ago`;
  } else {
    return formatDate(d);
  }
};

export const formatDuration = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m ${remainingSeconds}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${remainingSeconds}s`;
  } else {
    return `${remainingSeconds}s`;
  }
};

export const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

export const formatGasPrice = (gasPrice: string | number): string => {
  const price = typeof gasPrice === 'string' ? parseFloat(gasPrice) : gasPrice;
  return `${price.toFixed(2)} Gwei`;
};

export const formatGasUsed = (gasUsed: string | number): string => {
  const used = typeof gasUsed === 'string' ? parseFloat(gasUsed) : gasUsed;
  return new Intl.NumberFormat('en-US').format(used);
};

export const formatAPY = (apy: number): string => {
  return `${(apy * 100).toFixed(2)}%`;
};

export const formatTVL = (tvl: number): string => {
  return formatCurrency(tvl / 1e18);
};

export const formatTokenAmount = (amount: string | number, decimals: number = 18): string => {
  const value = typeof amount === 'string' ? parseFloat(amount) : amount;
  const formatted = value / Math.pow(10, decimals);
  return formatNumber(formatted, 6);
};

export const formatRiskScore = (risk: number): string => {
  if (risk < 0.2) return 'Low';
  if (risk < 0.5) return 'Medium';
  if (risk < 0.8) return 'High';
  return 'Very High';
};

export const getRiskColor = (risk: number): string => {
  if (risk < 0.2) return 'text-green-600';
  if (risk < 0.5) return 'text-yellow-600';
  if (risk < 0.8) return 'text-orange-600';
  return 'text-red-600';
};

export const getRiskBgColor = (risk: number): string => {
  if (risk < 0.2) return 'bg-green-100 dark:bg-green-900';
  if (risk < 0.5) return 'bg-yellow-100 dark:bg-yellow-900';
  if (risk < 0.8) return 'bg-orange-100 dark:bg-orange-900';
  return 'bg-red-100 dark:bg-red-900';
};
