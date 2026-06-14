-- Get admin ID
\gset adminid_var
SELECT id FROM users WHERE role = 'ADMIN' LIMIT 1;

-- Insert ad positions with updatedAt
INSERT INTO ad_positions (id, name, "displayName", description, "updatedAt") VALUES
('home-top', 'home-top', '首页顶部横幅', '首页顶部大横幅广告', NOW()),
('home-sidebar', 'home-sidebar', '首页侧边栏', '首页右侧广告位', NOW()),
('jobs-top', 'jobs-top', '职位页顶部', '职位列表顶部广告', NOW()),
('jobs-sidebar', 'jobs-sidebar', '职位页侧边栏', '职位页右侧广告', NOW()),
('blog-top', 'blog-top', '博客页顶部', '博客页顶部广告', NOW()),
('blog-sidebar', 'blog-sidebar', '博客侧边栏', '博客侧边广告', NOW()),
('detail-top', 'detail-top', '详情页顶部', '职位详情顶部广告', NOW())
ON CONFLICT (id) DO NOTHING;

-- Insert ads
INSERT INTO ads (id, title, type, "linkUrl", "positionId", status, "startDate", "authorId", "textContent")
SELECT gen_random_uuid(), '热招职位推荐', 'TEXT', '/zh/jobs', 'home-top', 'ACTIVE', NOW(), :'adminid_var', '查看最新热门职位'
WHERE NOT EXISTS (SELECT 1 FROM ads WHERE "positionId" = 'home-top');

INSERT INTO ads (id, title, type, "linkUrl", "positionId", status, "startDate", "authorId", "textContent")
SELECT gen_random_uuid(), '优质企业推荐', 'TEXT', '/zh/companies', 'home-sidebar', 'ACTIVE', NOW(), :'adminid_var', '优质企业招聘中'
WHERE NOT EXISTS (SELECT 1 FROM ads WHERE "positionId" = 'home-sidebar');

INSERT INTO ads (id, title, type, "linkUrl", "positionId", status, "startDate", "authorId", "textContent")
SELECT gen_random_uuid(), 'Web3高薪职位', 'TEXT', '/zh/jobs', 'jobs-top', 'ACTIVE', NOW(), :'adminid_var', 'Web3高薪职位'
WHERE NOT EXISTS (SELECT 1 FROM ads WHERE "positionId" = 'jobs-top');

-- Verify
SELECT id, name FROM ad_positions ORDER BY name;
SELECT id, title, type, status FROM ads;
