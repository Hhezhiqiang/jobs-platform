INSERT INTO ads (id, title, type, "linkUrl", "positionId", status, "startDate", "authorId", "textContent")
SELECT gen_random_uuid(), '热招职位推荐', 'TEXT', '/zh/jobs', 'home-top', 'ACTIVE', NOW(), 'aaa2604d-96d5-431d-b4a8-cb7e5455e103', '查看最新热门职位'
WHERE NOT EXISTS (SELECT 1 FROM ads WHERE "positionId" = 'home-top');

INSERT INTO ads (id, title, type, "linkUrl", "positionId", status, "startDate", "authorId", "textContent")
SELECT gen_random_uuid(), '优质企业推荐', 'TEXT', '/zh/companies', 'home-sidebar', 'ACTIVE', NOW(), 'aaa2604d-96d5-431d-b4a8-cb7e5455e103', '优质企业招聘中'
WHERE NOT EXISTS (SELECT 1 FROM ads WHERE "positionId" = 'home-sidebar');

INSERT INTO ads (id, title, type, "linkUrl", "positionId", status, "startDate", "authorId", "textContent")
SELECT gen_random_uuid(), 'Web3高薪职位', 'TEXT', '/zh/jobs', 'jobs-top', 'ACTIVE', NOW(), 'aaa2604d-96d5-431d-b4a8-cb7e5455e103', 'Web3高薪职位'
WHERE NOT EXISTS (SELECT 1 FROM ads WHERE "positionId" = 'jobs-top');

SELECT id, title, type, status FROM ads;
