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
  'CH': { region: 'europe', regionZh: '欧洲', regionEn: 'Europe' },
  'SE': { region: 'europe', regionZh: '欧洲', regionEn: 'Europe' },
  'PL': { region: 'europe', regionZh: '欧洲', regionEn: 'Europe' },
  
  // 北美
  'US': { region: 'north-america', regionZh: '北美', regionEn: 'North America' },
  'CA': { region: 'north-america', regionZh: '北美', regionEn: 'North America' },
  
  // 南美
  'BR': { region: 'south-america', regionZh: '南美', regionEn: 'South America' },
  
  // 亚太
  'SG': { region: 'asia-pacific', regionZh: '亚太', regionEn: 'Asia Pacific' },
  'AU': { region: 'asia-pacific', regionZh: '亚太', regionEn: 'Asia Pacific' },
  'JP': { region: 'asia-pacific', regionZh: '亚太', regionEn: 'Asia Pacific' },
  'IN': { region: 'asia-pacific', regionZh: '亚太', regionEn: 'Asia Pacific' },
  'KR': { region: 'asia-pacific', regionZh: '亚太', regionEn: 'Asia Pacific' },
  'HK': { region: 'asia-pacific', regionZh: '亚太', regionEn: 'Asia Pacific' },
  'CN': { region: 'asia-pacific', regionZh: '亚太', regionEn: 'Asia Pacific' },
  
  // 中东
  'AE': { region: 'middle-east', regionZh: '中东', regionEn: 'Middle East' },
  'IL': { region: 'middle-east', regionZh: '中东', regionEn: 'Middle East' },
};

export const GLOBAL_CITIES: Record<string, { city: string; cityZh: string; cityEn: string }> = {
  'London': { city: 'london', cityZh: '伦敦', cityEn: 'London' },
  'Manchester': { city: 'manchester', cityZh: '曼彻斯特', cityEn: 'Manchester' },
  'Birmingham': { city: 'birmingham', cityZh: '伯明翰', cityEn: 'Birmingham' },
  'Edinburgh': { city: 'edinburgh', cityZh: '爱丁堡', cityEn: 'Edinburgh' },
  'Bristol': { city: 'bristol', cityZh: '布里斯托尔', cityEn: 'Bristol' },
  'New York': { city: 'new-york', cityZh: '纽约', cityEn: 'New York' },
  'San Francisco': { city: 'san-francisco', cityZh: '旧金山', cityEn: 'San Francisco' },
  'Seattle': { city: 'seattle', cityZh: '西雅图', cityEn: 'Seattle' },
  'Austin': { city: 'austin', cityZh: '奥斯汀', cityEn: 'Austin' },
  'Boston': { city: 'boston', cityZh: '波士顿', cityEn: 'Boston' },
  'Los Angeles': { city: 'los-angeles', cityZh: '洛杉矶', cityEn: 'Los Angeles' },
  'Chicago': { city: 'chicago', cityZh: '芝加哥', cityEn: 'Chicago' },
  'Denver': { city: 'denver', cityZh: '丹佛', cityEn: 'Denver' },
  'Miami': { city: 'miami', cityZh: '迈阿密', cityEn: 'Miami' },
  'Singapore': { city: 'singapore', cityZh: '新加坡', cityEn: 'Singapore' },
  'Dubai': { city: 'dubai', cityZh: '迪拜', cityEn: 'Dubai' },
  'Abu Dhabi': { city: 'abu-dhabi', cityZh: '阿布扎比', cityEn: 'Abu Dhabi' },
  'Berlin': { city: 'berlin', cityZh: '柏林', cityEn: 'Berlin' },
  'Munich': { city: 'munich', cityZh: '慕尼黑', cityEn: 'Munich' },
  'Frankfurt': { city: 'frankfurt', cityZh: '法兰克福', cityEn: 'Frankfurt' },
  'Hamburg': { city: 'hamburg', cityZh: '汉堡', cityEn: 'Hamburg' },
  'Toronto': { city: 'toronto', cityZh: '多伦多', cityEn: 'Toronto' },
  'Vancouver': { city: 'vancouver', cityZh: '温哥华', cityEn: 'Vancouver' },
  'Montreal': { city: 'montreal', cityZh: '蒙特利尔', cityEn: 'Montreal' },
  'Ottawa': { city: 'ottawa', cityZh: '渥太华', cityEn: 'Ottawa' },
  'Sydney': { city: 'sydney', cityZh: '悉尼', cityEn: 'Sydney' },
  'Melbourne': { city: 'melbourne', cityZh: '墨尔本', cityEn: 'Melbourne' },
  'Brisbane': { city: 'brisbane', cityZh: '布里斯班', cityEn: 'Brisbane' },
  'Perth': { city: 'perth', cityZh: '珀斯', cityEn: 'Perth' },
  'Tokyo': { city: 'tokyo', cityZh: '东京', cityEn: 'Tokyo' },
  'Osaka': { city: 'osaka', cityZh: '大阪', cityEn: 'Osaka' },
  'Paris': { city: 'paris', cityZh: '巴黎', cityEn: 'Paris' },
  'Lyon': { city: 'lyon', cityZh: '里昂', cityEn: 'Lyon' },
  'Bangalore': { city: 'bangalore', cityZh: '班加罗尔', cityEn: 'Bangalore' },
  'Mumbai': { city: 'mumbai', cityZh: '孟买', cityEn: 'Mumbai' },
  'Hyderabad': { city: 'hyderabad', cityZh: '海得拉巴', cityEn: 'Hyderabad' },
  'Delhi': { city: 'delhi', cityZh: '德里', cityEn: 'Delhi' },
  'Amsterdam': { city: 'amsterdam', cityZh: '阿姆斯特丹', cityEn: 'Amsterdam' },
  'Rotterdam': { city: 'rotterdam', cityZh: '鹿特丹', cityEn: 'Rotterdam' },
  'São Paulo': { city: 'sao-paulo', cityZh: '圣保罗', cityEn: 'São Paulo' },
  'Rio de Janeiro': { city: 'rio-de-janeiro', cityZh: '里约热内卢', cityEn: 'Rio de Janeiro' },
  'Zurich': { city: 'zurich', cityZh: '苏黎世', cityEn: 'Zurich' },
  'Geneva': { city: 'geneva', cityZh: '日内瓦', cityEn: 'Geneva' },
  'Stockholm': { city: 'stockholm', cityZh: '斯德哥尔摩', cityEn: 'Stockholm' },
  'Dublin': { city: 'dublin', cityZh: '都柏林', cityEn: 'Dublin' },
  'Milan': { city: 'milan', cityZh: '米兰', cityEn: 'Milan' },
  'Rome': { city: 'rome', cityZh: '罗马', cityEn: 'Rome' },
  'Madrid': { city: 'madrid', cityZh: '马德里', cityEn: 'Madrid' },
  'Barcelona': { city: 'barcelona', cityZh: '巴塞罗那', cityEn: 'Barcelona' },
  'Warsaw': { city: 'warsaw', cityZh: '华沙', cityEn: 'Warsaw' },
  'Krakow': { city: 'krakow', cityZh: '克拉科夫', cityEn: 'Krakow' },
  'Seoul': { city: 'seoul', cityZh: '首尔', cityEn: 'Seoul' },
  'Hong Kong': { city: 'hong-kong', cityZh: '香港', cityEn: 'Hong Kong' },
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
