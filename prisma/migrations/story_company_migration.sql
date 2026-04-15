// 职业叙事（职业故事）添加 companyId 字段和相关索引的 migration 说明
// 需要在 CareerStory 表中添加以下字段和索引

/*
model CareerStory {
  id          String   @id @default(cuid())
  title       String
  content     String
  type        StoryType  @default(EXPERIENCE)
  timeline    Json?      // 可选时间线数据
  authorId    String
  author      users      @relation(fields: [authorId], references: [id], onDelete: Cascade)
  
  // ========== 新增字段 ==========
  companyId   String?    // 关联公司ID（可选）
  company     companies? @relation(fields: [companyId], references: [id], onDelete: SetNull)
  
  // 内推邀请相关
  invitationStatus String? @default(null) // 邀请状态：pending, accepted, declined
  invitationSentAt DateTime?
  invitationBy     String?   // 邀请人ID
  
  viewCount     Int    @default(0)
  resonanceCount Int   @default(0)  // 共鸣数（点赞）
  isFeatured    Boolean @default(false)
  
  createdAt   DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  // 关联
  resonances  StoryResonance[]
  
  @@index([authorId, createdAt])
  @@index([type, createdAt])
  @@index([isFeatured, createdAt])
  @@index([companyId, createdAt])  // 新增：用于公司视角查看故事
  @@map("career_stories")
}

// 需要在 companies 模型中添加反向关系
model companies {
  ...
  careerStories CareerStory[]  // 添加这个关联
  ...
}
*/

// 执行以下 SQL 来添加字段：
/*
ALTER TABLE career_stories 
ADD COLUMN company_id TEXT,
ADD COLUMN invitation_status TEXT,
ADD COLUMN invitation_sent_at TIMESTAMP,
ADD COLUMN invitation_by TEXT;

CREATE INDEX idx_career_stories_company_id_created_at ON career_stories(company_id, created_at);

-- 添加外键约束
ALTER TABLE career_stories 
ADD CONSTRAINT fk_career_stories_company 
FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE SET NULL;
*/
