with open("src/app/[locale]/jobs/city/[city]/[type]/page.tsx") as f:
    content = f.read()

city_map = '''const CITY_MAP: Record<string, string> = {
    beijing: "北京", shanghai: "上海", shenzhen: "深圳", hangzhou: "杭州",
    guangzhou: "广州", chengdu: "成都", wuhan: "武汉", xian: "西安",
    nanjing: "南京", suzhou: "苏州", remote: "远程", "": "全国", all: "全国"
};
const CITY_EN: Record<string, string> = {
    "北京": "Beijing", "上海": "Shanghai", "深圳": "Shenzhen", "杭州": "Hangzhou",
    "广州": "Guangzhou", "成都": "Chengdu", "武汉": "Wuhan", "西安": "Xian",
    "南京": "Nanjing", "苏州": "Suzhou", "远程": "Remote", "全国": "All"
};
function getCityName(slug: string, isEn: boolean): string {
    const zh = CITY_MAP[slug] || slug;
    return isEn ? (CITY_EN[zh] || slug) : zh;
}

'''

content = content.replace(
    "// 城市介绍（复用）",
    city_map + "// 城市介绍（复用）"
)

# In generateTypeMetadata, add city name mapping
content = content.replace(
    'function generateTypeMetadata(city: string, type: string, locale = "zh"): Metadata {\n  const typeLabel = getTypeLabel(type);\n  const cityIntro = CITY_INTRO[city] || "";\n  const isEn = locale === "en";',
    '''function generateTypeMetadata(rawCity: string, type: string, locale = "zh"): Metadata {
  const isEn = locale === "en";
  const city = getCityName(rawCity, isEn);
  const typeLabel = getTypeLabel(type, isEn);
  const cityIntro = CITY_INTRO[city] || CITY_INTRO[rawCity] || "";'''
)

# Fix url to use rawCity
content = content.replace(
    'const url = `${SITE_URL}/${locale}/jobs/city/${encodeURIComponent(city)}/${encodeURIComponent(type)}`;',
    'const url = `${SITE_URL}/${locale}/jobs/city/${encodeURIComponent(rawCity)}/${encodeURIComponent(type)}`;'
)

# Fix generateMetadata to pass rawCity
content = content.replace(
    '''export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { city: rawCity, type: rawType, locale } = await params;
  const city = decodeURIComponent(rawCity);
  const type = decodeURIComponent(rawType);
  return generateTypeMetadata(city, type, locale);
}''',
    '''export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { city, type, locale } = await params;
  return generateTypeMetadata(city, type, locale);
}'''
)

# Fix the main component
content = content.replace(
    '''export default async function CityTypeJobsPage({ params }: PageProps) {
  const { city: rawCity, type: rawType, locale } = await params;
  const city = decodeURIComponent(rawCity);
  const type = decodeURIComponent(rawType);

  const typeInfo = JOB_TYPES[type];
  if (!typeInfo) {
    notFound();
  }''',
    '''export default async function CityTypeJobsPage({ params }: PageProps) {
  const { city, type, locale } = await params;
  const isEn = locale === "en";
  const cityName = getCityName(city, isEn);
  const typeLabel = getTypeLabel(type, isEn);

  const typeInfo = JOB_TYPES[type];
  if (!typeInfo) notFound();

  const cityIntro = CITY_INTRO[cityName] || CITY_INTRO[city] || "";'''
)

# Fix whereClause
content = content.replace(
    '''  if (city !== "" && city !== "all") {
    whereClause.city = city;
  }''',
    '''  if (city !== "" && city !== "all") {
    const zhCity = getCityName(city, false);
    whereClause.OR = [{ city }, { city: zhCity }];
  }'''
)

# Fix h1
content = content.replace(
    '{isEn ? `${city} ${typeLabel} Jobs` : `${city}${typeLabel}招聘`}',
    '{isEn ? `${cityName} ${typeLabel} Jobs` : `${cityName}${typeLabel}招聘`}'
)

# Fix breadcrumb
content = content.replace(
    '{ name: "城市职位", url: null }',
    '{ name: `${cityName} ${typeLabel}`, url: "" }'
)

# Fix stats
content = content.replace(
    '{isEn ? `找到 ${jobs.length} 个${typeLabel}职位` : `共找到 ${jobs.length} 个${typeLabel}职位`}',
    '{isEn ? `Found ${jobs.length} ${typeLabel.toLowerCase()} jobs` : `共找到 ${jobs.length} 个${typeLabel}职位`}'
)

with open("src/app/[locale]/jobs/city/[city]/[type]/page.tsx", "w") as f:
    f.write(content)
print("done")
