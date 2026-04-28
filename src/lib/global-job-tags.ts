/**
 * 全球职位分类系统
 * 自动根据国家和城市分配地区标签
 */

export const GLOBAL_REGIONS: Record<string, { region: string; regionZh: string; regionEn: string }> = {
  // 欧洲
  'GB': { region: 'europe', regionZh: '欧洲', regionEn: 'Europe' },
  'DE': { region: 'europe', regionZh: '欧洲', regionEn: 'Europe' },
  'FR': { region: 'europe', regionZh: '欧洲', regionEn: 'Europe' },
  'NL': { region: 'europe', regionZh: '欧洲', regionEn: 'Europe' },
  'IE': { region: 'europe', regionZh: '欧洲', regionEn: 'Europe' },
  'ES': { region: 'europe', regionZh: '欧洲', regionEn: 'Europe' },
  'IT': { region: 'europe', regionZh: '欧洲', regionEn: 'Europe' },
  
  // 北美
  'US': { region: 'north-america', regionZh: '北美', regionEn: 'North America' },
  'CA': { region: 'north-america', regionZh: '北美', regionEn: 'North America' },
  
  // 亚太
  'SG': { region: 'asia-pacific', regionZh: '亚太', regionEn: 'Asia Pacific' },
  'AU': { region: 'asia-pacific', regionZh: '亚太', regionEn: 'Asia Pacific' },
  'JP': { region: 'asia-pacific', regionZh: '亚太', regionEn: 'Asia Pacific' },
  'IN': { region: 'asia-pacific', regionZh: '亚太', regionEn: 'Asia Pacific' },
  'CN': { region: 'asia-pacific', regionZh: '亚太', regionEn: 'Asia Pacific' },
  
  // 中东
  'AE': { region: 'middle-east', regionZh: '中东', regionEn: 'Middle East' },
  'IL': { region: 'middle-east', regionZh: '中东', regionEn: 'Middle East' },
};

export const GLOBAL_CITIES: Record<string, { city: string; cityZh: string; cityEn: string }> = {
  'London': { city: 'london', cityZh: '伦敦', cityEn: 'London' },
  'Manchester': { city: 'manchester', cityZh: '曼彻斯特', cityEn: 'Manchester' },
  'New York': { city: 'new-york', cityZh: '纽约', cityEn: 'New York' },
  'San Francisco': { city: 'san-francisco', cityZh: '旧金山', cityEn: 'San Francisco' },
  'Singapore': { city: 'singapore', cityZh: '新加坡', cityEn: 'Singapore' },
  'Sydney': { city: 'sydney', cityZh: '悉尼', cityEn: 'Sydney' },
  'Tokyo': { city: 'tokyo', cityZh: '东京', cityEn: 'Tokyo' },
  'Berlin': { city: 'berlin', cityZh: '柏林', cityEn: 'Berlin' },
  'Dubai': { city: 'dubai', cityZh: '迪拜', cityEn: 'Dubai' },
};

export function getRegionTags(countryCode: string, location: string): string[] {
  const tags: string[] = ['global-jobs']; // 所有 API 职位都标记为全球职位
  
  // 添加地区标签
  const regionInfo = GLOBAL_REGIONS[countryCode.toUpperCase()];
  if (regionInfo) {
    tags.push(`region-${regionInfo.region}`);
    tags.push(regionInfo.region); // 中文名
  }
  
  // 添加城市标签
  for (const [cityName, cityInfo] of Object.entries(GLOBAL_CITIES)) {
    if (location.includes(cityName)) {
      tags.push(`city-${cityInfo.city}`);
      tags.push(cityInfo.city); // 城市名
    }
  }
  
  // 远程工作标签
  if (location.toLowerCase().includes('remote')) {
    tags.push('remote');
    tags.push('远程');
  }
  
  return [...new Set(tags)]; // 去重
}
