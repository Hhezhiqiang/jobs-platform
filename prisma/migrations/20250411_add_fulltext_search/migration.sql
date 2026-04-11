-- 添加 SearchQuery 表
CREATE TABLE IF NOT EXISTS "search_queries" (
    "id" TEXT NOT NULL,
    "query" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 1,
    "last_searched" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "search_queries_pkey" PRIMARY KEY ("id")
);

-- 添加唯一约束
CREATE UNIQUE INDEX IF NOT EXISTS "search_queries_query_key" ON "search_queries"("query");

-- 添加索引
CREATE INDEX IF NOT EXISTS "search_queries_count_idx" ON "search_queries"("count");
CREATE INDEX IF NOT EXISTS "search_queries_last_searched_idx" ON "search_queries"("last_searched");

-- 添加 PostgreSQL 全文搜索索引（可选优化）
-- 创建一个搜索向量列用于更高效的全文搜索
ALTER TABLE "jobs" ADD COLUMN IF NOT EXISTS "search_vector" tsvector;

-- 创建更新搜索向量的函数
CREATE OR REPLACE FUNCTION update_job_search_vector()
RETURNS TRIGGER AS $$
BEGIN
    NEW.search_vector := 
        setweight(to_tsvector('simple', COALESCE(NEW.title, '')), 'A') ||
        setweight(to_tsvector('simple', COALESCE(NEW.description, '')), 'B') ||
        setweight(to_tsvector('simple', COALESCE(NEW.location, '')), 'C') ||
        setweight(to_tsvector('simple', COALESCE(NEW.city, '')), 'C');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 创建触发器
DROP TRIGGER IF EXISTS job_search_vector_update ON "jobs";
CREATE TRIGGER job_search_vector_update
    BEFORE INSERT OR UPDATE ON "jobs"
    FOR EACH ROW
    EXECUTE FUNCTION update_job_search_vector();

-- 为现有数据更新搜索向量
UPDATE "jobs" SET search_vector = 
    setweight(to_tsvector('simple', COALESCE(title, '')), 'A') ||
    setweight(to_tsvector('simple', COALESCE(description, '')), 'B') ||
    setweight(to_tsvector('simple', COALESCE(location, '')), 'C') ||
    setweight(to_tsvector('simple', COALESCE(city, '')), 'C');

-- 创建 GIN 索引
CREATE INDEX IF NOT EXISTS "jobs_search_vector_idx" ON "jobs" USING GIN (search_vector);

-- 添加公司相关索引
CREATE INDEX IF NOT EXISTS "companies_name_idx" ON "companies" USING gin(to_tsvector('simple', COALESCE(name, '')));
CREATE INDEX IF NOT EXISTS "companies_description_idx" ON "companies" USING gin(to_tsvector('simple', COALESCE(description, '')));
