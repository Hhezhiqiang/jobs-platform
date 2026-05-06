/**
 * 岗位分类映射系统
 * 将 Adzuna 原始分类 + 职位标题/描述 映射为标准化的技术方向分类
 */

// ─── Adzuna 原始分类 → 标准化分类 ─────────────────────────

export const ADZUNA_CATEGORY_MAP: Record<string, string> = {
  'it-jobs': 'tech',
  'engineering-jobs': 'tech',
  'software-jobs': 'tech',
  'developer-programming-jobs': 'tech',
  'data-science-jobs': 'data',
  'data-analyst-jobs': 'data',
  'product-management-jobs': 'product',
  'digital-jobs': 'tech',
  'cyber-security-jobs': 'security',
  'networking-jobs': 'infrastructure',
  'cloud-jobs': 'infrastructure',
  'devops-jobs': 'infrastructure',
  'mobile-jobs': 'mobile',
  'frontend-jobs': 'frontend',
  'backend-jobs': 'backend',
  'qa-testing-jobs': 'qa',
  'ui-ux-design-jobs': 'design',
  'graphic-designer-jobs': 'design',
};

// ─── 技术方向关键词映射 ─────────────────────────────────────

export const TECH_DIRECTION_KEYWORDS: Record<string, string[]> = {
  frontend: [
    'frontend', 'front-end', 'front end', 'ui developer', 'ui engineer',
    'react', 'vue', 'angular', 'next.js', 'nuxt', 'svelte',
    'javascript', 'typescript', 'html', 'css', 'web developer',
    'web designer', 'ui/ux',
  ],
  backend: [
    'backend', 'back-end', 'back end', 'server-side', 'server side',
    'java', 'python', 'go', 'golang', 'node.js', 'nodejs', 'node.js',
    'spring', 'django', 'flask', 'fastapi', 'ruby', 'rails',
    'php', 'laravel', 'c#', '.net', 'asp.net', 'dotnet',
    'api developer', 'microservices',
  ],
  fullstack: [
    'fullstack', 'full-stack', 'full stack', 'fullstack developer',
    'full stack engineer', 'web developer',
  ],
  data: [
    'data scientist', 'data science', 'data engineer', 'data analyst',
    'machine learning', 'ml engineer', 'deep learning', 'ai engineer',
    'big data', 'data analytics', 'data architecture',
    'tensorflow', 'pytorch', 'spark', 'hadoop',
  ],
  devops: [
    'devops', 'dev-ops', 'site reliability', 'sre',
    'infrastructure', 'kubernetes', 'docker', 'terraform',
    'ci/cd', 'jenkins', 'ansible', 'cloud engineer',
    'platform engineer',
  ],
  mobile: [
    'mobile developer', 'ios developer', 'android developer',
    'react native', 'flutter', 'swift', 'kotlin',
    'mobile engineer', 'app developer',
  ],
  product: [
    'product manager', 'product owner', 'product management',
    'technical product manager', 'senior product manager',
  ],
  security: [
    'security engineer', 'cyber security', 'infosec', 'penetration testing',
    'security analyst', 'application security', 'appsec',
  ],
  qa: [
    'qa engineer', 'qa analyst', 'test engineer', 'test automation',
    'selenium', 'cypress', 'playwright', 'quality assurance',
    'sdet',
  ],
  design: [
    'ui designer', 'ux designer', 'ui/ux', 'product designer',
    'visual designer', 'interaction designer', 'figma', 'sketch',
  ],
  management: [
    'engineering manager', 'technical lead', 'tech lead',
    'head of engineering', 'vp of engineering', 'director of engineering',
    'team lead', 'principal engineer',
  ],
};

/**
 * 根据 Adzuna 分类标签获取标准化分类
 */
export function mapAdzunaCategory(tag: string | undefined): string | null {
  if (!tag) return null;
  const normalized = tag.toLowerCase().trim();
  return ADZUNA_CATEGORY_MAP[normalized] || null;
}

/**
 * 根据职位标题和描述推断技术方向
 * 返回最匹配的方向，如果没有匹配返回 null
 */
export function inferTechDirection(title: string, description: string): string | null {
  const text = `${title} ${description}`.toLowerCase();

  // 按优先级顺序匹配（更具体的方向先匹配）
  const priorityOrder = [
    'frontend', 'backend', 'fullstack', 'data', 'mobile',
    'devops', 'security', 'qa', 'design', 'product', 'management',
  ];

  for (const direction of priorityOrder) {
    const keywords = TECH_DIRECTION_KEYWORDS[direction];
    if (keywords.some((kw) => text.includes(kw))) {
      return direction;
    }
  }

  return null;
}

/**
 * 综合分类：结合 Adzuna 分类 + 标题/描述推断
 * Adzuna 分类优先，如果没有则用推断结果
 */
export function classifyJob(
  adzunaCategoryTag: string | undefined,
  title: string,
  description: string,
): string | null {
  // 1. 先尝试 Adzuna 分类
  const adzunaClass = mapAdzunaCategory(adzunaCategoryTag);
  if (adzunaClass) return adzunaClass;

  // 2. 再尝试从标题/描述推断
  return inferTechDirection(title, description);
}
