/**
 * 格式化地点显示
 * 输入："London, UK" 或 "UK"
 * 输出："London, UK" 或 "United Kingdom"
 */
export function formatLocation(location: string | null, city: string | null, country: string | null): string {
  if (!location && !city && !country) return 'Remote';
  
  // 如果有完整地，直接返回
  if (location && location.includes(',')) {
    return location;
  }
  
  // 如果只有城市和国家
  if (city && country) {
    return `${city}, ${country}`;
  }
  
  // 如果只有城市
  if (city) {
    return city;
  }
  
  // 如果只有国家
  if (country) {
    const countryNames: Record<string, string> = {
      'GB': 'United Kingdom',
      'US': 'United States',
      'SG': 'Singapore',
      'DE': 'Germany',
      'AU': 'Australia',
      'CN': 'China'
    };
    return countryNames[country] || country;
  }
  
  return 'Remote';
}
