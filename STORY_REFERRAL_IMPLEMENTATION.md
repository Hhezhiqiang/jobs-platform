# 叙事内推功能 - 实现汇总

## 功能概述
开发叙事内推功能，让用户在职业故事中@公司表达求职意向，公司HR可以查看相关故事并发送内推邀请。

## 数据模型变更

### 1. Prisma Schema 更新
**文件**: `/prisma/schema.prisma`

#### CareerStory 表新增字段：
- `companyId` (String?, optional) - 关联公司ID
- `company` (Relation to companies) - 公司关联
- `invitationStatus` (String?, optional) - 邀请状态: pending, accepted, declined
- `invitationSentAt` (DateTime?, optional) - 邀请发送时间
- `invitationBy` (String?, optional) - 邀请人ID

#### companies 表新增关联：
- `careerStories` (CareerStory[]) - 反向关联

#### 新增索引：
- `@@index([companyId, createdAt])` - 用于公司视角查询故事

**Migration SQL** (`/prisma/migrations/story_company_migration.sql`):
```sql
ALTER TABLE career_stories 
ADD COLUMN company_id TEXT,
ADD COLUMN invitation_status TEXT,
ADD COLUMN invitation_sent_at TIMESTAMP,
ADD COLUMN invitation_by TEXT;

CREATE INDEX idx_career_stories_company_id_created_at ON career_stories(company_id, created_at);

ALTER TABLE career_stories 
ADD CONSTRAINT fk_career_stories_company 
FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE SET NULL;
```

## API 变更

### 1. 故事列表/创建 API
**文件**: `/src/app/api/stories/route.ts`

- **GET**: 新增 `companyId` 查询参数支持，返回包含公司信息的故事列表
- **POST**: 新增支持 `companyId` 参数，创建故事时关联公司

### 2. 故事详情 API
**文件**: `/src/app/api/stories/[id]/route.ts`

- **GET**: 返回公司信息（包括职位数统计），并检查用户是否有邀请权限 (`canInvite`)
- **PATCH**: 支持更新 `companyId` 字段

### 3. 内推邀请 API (新增)
**文件**: `/src/app/api/stories/[id]/invite/route.ts`

- **POST**: 发送内推邀请
  - 检查用户是否是公司成员（ADMIN/RECRUITER）
  - 创建通知给故事作者
  - 更新故事的 invitationStatus
  
- **GET**: 检查邀请状态

### 4. 公司故事列表 API (新增)
**文件**: `/src/app/api/companies/[id]/stories/route.ts`

- **GET**: 获取@该公司的故事列表
  - 支持按邀请状态过滤 (`status` 参数)
  - 返回 `canManage` 标识用户是否有权限管理

### 5. 公司搜索 API (新增)
**文件**: `/src/app/api/companies/search/route.ts`

- **GET**: 搜索公司（按名称、英文名称、slug），只返回已认证的公司

## 前端页面变更

### 1. 故事编辑器增强
**文件**: `/src/app/[locale]/career-trail/write/page.tsx`

新增功能：
- 添加「@公司」按钮
- 公司选择器弹窗（搜索、选择）
- 选中公司后显示为标签样式
- 可选择移除已选公司
- 保存时存储关联公司ID

### 2. 故事详情页增强
**文件**: `/src/app/[locale]/career-trail/[id]/page.tsx`

更新：
- 传递公司信息和 `canInvite` 权限给 StoryDetail 组件

**文件**: `/src/components/career-trail/story-detail.tsx`

新增功能：
- 显示公司卡片（logo、名称、描述、位置、规模、职位数）
- 显示「该公司正在招人」提示
- 「查看公司」和「查看职位」按钮
- HR视角：显示「向作者发送内推邀请」按钮
- 显示邀请状态（待处理/已接受/已婉拒）

### 3. 公司视角故事列表 (新增)
**文件**: `/src/app/[locale]/companies/[id]/stories/page.tsx`

功能：
- 显示@该公司的所有故事
- 按邀请状态筛选（全部/待处理/已接受）
- 故事卡片显示作者信息、浏览数、共鸣数
- 一键邀请投递按钮
- 邀请状态管理
- 权限检查（只有公司成员可以管理）

## 使用流程

### 用户端流程：
1. 用户写故事时点击「@ 提及公司」
2. 搜索并选择感兴趣的公司
3. 发布故事
4. 故事详情页显示公司卡片和「正在招人」提示
5. 可以查看公司和职位

### HR端流程：
1. HR访问 `/companies/{id}/stories`
2. 查看所有@该公司的故事列表
3. 筛选不同状态的故事
4. 点击「一键邀请投递」发送内推邀请
5. 作者收到通知
6. 可以查看邀请状态

## 权限控制

1. **@公司功能**: 所有用户都可以在写故事时@公司（可选）
2. **查看公司故事列表**: 所有用户都可以查看
3. **发送内推邀请**: 只有公司成员（ADMIN/RECRUITER）可以操作
4. **查看邀请状态**: 故事作者或公司成员可以查看

## 后续建议

1. **数据库迁移**: 运行 SQL migration 添加新字段
2. **Prisma Client 更新**: 运行 `npx prisma generate` 更新类型
3. **通知系统**: 确保通知系统已配置，以便作者收到内推邀请通知
4. **邮件通知**: 可以扩展为同时发送邮件通知
5. **移动端适配**: 公司选择器在移动端可能需要进一步优化
