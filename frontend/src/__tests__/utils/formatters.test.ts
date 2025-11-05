import {
  formatCurrency,
  formatPercentage,
  formatNumber,
  formatLargeNumber,
  formatAddress,
  formatHash,
  formatDate,
  formatRelativeTime,
  formatDuration,
  formatBytes,
  formatGasPrice,
  formatGasUsed,
  formatAPY,
  formatTVL,
  formatTokenAmount,
  formatRiskScore,
  getRiskColor,
  getRiskBgColor
} from '@/utils/formatters';

describe('formatters', () => {
  describe('formatCurrency', () => {
    it('should format currency correctly', () => {
      expect(formatCurrency(1234.56)).toBe('$1,234.56');
      expect(formatCurrency(1234.56, 'EUR')).toBe('€1,234.56');
    });
  });

  describe('formatPercentage', () => {
    it('should format percentage correctly', () => {
      expect(formatPercentage(0.1234)).toBe('12.34%');
      expect(formatPercentage(0.1234, 1)).toBe('12.3%');
    });
  });

  describe('formatNumber', () => {
    it('should format number correctly', () => {
      expect(formatNumber(1234.5678)).toBe('1,234.57');
      expect(formatNumber(1234.5678, 1)).toBe('1,234.6');
    });
  });

  describe('formatLargeNumber', () => {
    it('should format large numbers correctly', () => {
      expect(formatLargeNumber(1000)).toBe('1.0K');
      expect(formatLargeNumber(1000000)).toBe('1.0M');
      expect(formatLargeNumber(1000000000)).toBe('1.0B');
      expect(formatLargeNumber(500)).toBe('500');
    });
  });

  describe('formatAddress', () => {
    it('should format address correctly', () => {
      const address = '0x1234567890abcdef1234567890abcdef12345678';
      expect(formatAddress(address)).toBe('0x1234...5678');
      expect(formatAddress(address, 4, 2)).toBe('0x12...78');
    });
  });

  describe('formatHash', () => {
    it('should format hash correctly', () => {
      const hash = '0x1234567890abcdef1234567890abcdef12345678';
      expect(formatHash(hash)).toBe('0x12345678...345678');
      expect(formatHash(hash, 4, 2)).toBe('0x1234...78');
    });
  });

  describe('formatDate', () => {
    it('should format date correctly', () => {
      const date = new Date('2023-12-25T10:30:00Z');
      expect(formatDate(date)).toContain('Dec 25, 2023');
    });
  });

  describe('formatRelativeTime', () => {
    it('should format relative time correctly', () => {
      const now = new Date();
      const oneMinuteAgo = new Date(now.getTime() - 60 * 1000);
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      expect(formatRelativeTime(oneMinuteAgo)).toBe('1 minute ago');
      expect(formatRelativeTime(oneHourAgo)).toBe('1 hour ago');
      expect(formatRelativeTime(oneDayAgo)).toBe('1 day ago');
    });
  });

  describe('formatDuration', () => {
    it('should format duration correctly', () => {
      expect(formatDuration(3661)).toBe('1h 1m 1s');
      expect(formatDuration(61)).toBe('1m 1s');
      expect(formatDuration(30)).toBe('30s');
    });
  });

  describe('formatBytes', () => {
    it('should format bytes correctly', () => {
      expect(formatBytes(1024)).toBe('1 KB');
      expect(formatBytes(1048576)).toBe('1 MB');
      expect(formatBytes(1073741824)).toBe('1 GB');
    });
  });

  describe('formatGasPrice', () => {
    it('should format gas price correctly', () => {
      expect(formatGasPrice('20.5')).toBe('20.50 Gwei');
      expect(formatGasPrice(20.5)).toBe('20.50 Gwei');
    });
  });

  describe('formatGasUsed', () => {
    it('should format gas used correctly', () => {
      expect(formatGasUsed('21000')).toBe('21,000');
      expect(formatGasUsed(21000)).toBe('21,000');
    });
  });

  describe('formatAPY', () => {
    it('should format APY correctly', () => {
      expect(formatAPY(0.05)).toBe('5.00%');
      expect(formatAPY(0.1234)).toBe('12.34%');
    });
  });

  describe('formatTVL', () => {
    it('should format TVL correctly', () => {
      expect(formatTVL(1000000000000000000000)).toBe('$1,000.00');
    });
  });

  describe('formatTokenAmount', () => {
    it('should format token amount correctly', () => {
      expect(formatTokenAmount('1000000000000000000000')).toBe('1,000.000000');
      expect(formatTokenAmount('1000000000000000000000', 6)).toBe('1,000.000000');
    });
  });

  describe('formatRiskScore', () => {
    it('should format risk score correctly', () => {
      expect(formatRiskScore(0.1)).toBe('Low');
      expect(formatRiskScore(0.3)).toBe('Medium');
      expect(formatRiskScore(0.6)).toBe('High');
      expect(formatRiskScore(0.9)).toBe('Very High');
    });
  });

  describe('getRiskColor', () => {
    it('should return correct risk color', () => {
      expect(getRiskColor(0.1)).toBe('text-green-600');
      expect(getRiskColor(0.3)).toBe('text-yellow-600');
      expect(getRiskColor(0.6)).toBe('text-orange-600');
      expect(getRiskColor(0.9)).toBe('text-red-600');
    });
  });

  describe('getRiskBgColor', () => {
    it('should return correct risk background color', () => {
      expect(getRiskBgColor(0.1)).toBe('bg-green-100 dark:bg-green-900');
      expect(getRiskBgColor(0.3)).toBe('bg-yellow-100 dark:bg-yellow-900');
      expect(getRiskBgColor(0.6)).toBe('bg-orange-100 dark:bg-orange-900');
      expect(getRiskBgColor(0.9)).toBe('bg-red-100 dark:bg-red-900');
    });
  });
});
