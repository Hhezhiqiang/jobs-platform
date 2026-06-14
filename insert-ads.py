import psycopg2
conn = psycopg2.connect(host="localhost", database="jobquip", user="jobquip_user", password="Hhezhiqiang123!")
cur = conn.cursor()
cur.execute("SELECT id FROM users WHERE role = 'ADMIN' LIMIT 1")
admin_id = cur.fetchone()[0]

positions = [
    ("home-top", "home-top", "首页顶部横幅", "首页顶部大横幅广告"),
    ("home-sidebar", "home-sidebar", "首页侧边栏", "首页右侧广告位"),
    ("jobs-top", "jobs-top", "职位页顶部", "职位列表顶部广告"),
    ("jobs-sidebar", "jobs-sidebar", "职位页侧边栏", "职位页右侧广告"),
    ("blog-top", "blog-top", "博客页顶部", "博客页顶部广告"),
    ("blog-sidebar", "blog-sidebar", "博客侧边栏", "博客侧边广告"),
    ("detail-top", "detail-top", "详情页顶部", "职位详情顶部广告"),
]
for p in positions:
    cur.execute("INSERT INTO ad_positions (id, name, displayName, description) VALUES (%s,%s,%s,%s) ON CONFLICT (id) DO NOTHING", p)

ads = [
    ("热招职位推荐", "TEXT", "/zh/jobs", "home-top", "查看最新热门职位"),
    ("优质企业推荐", "TEXT", "/zh/companies", "home-sidebar", "优质企业招聘中"),
    ("Web3高薪职位", "TEXT", "/zh/jobs", "jobs-top", "Web3高薪职位"),
]
for a in ads:
    sql = """INSERT INTO ads (id, title, type, "linkUrl", "positionId", status, "startDate", "authorId", "textContent")
SELECT gen_random_uuid(), %s, %s, %s, %s, 'ACTIVE', NOW(), %s, %s
WHERE NOT EXISTS (SELECT 1 FROM ads WHERE "positionId" = %s)"""
    cur.execute(sql, (a[0], a[1], a[2], a[3], admin_id, a[4], a[3]))

conn.commit()
cur.execute("SELECT id, name FROM ad_positions ORDER BY name")
for r in cur.fetchall(): print(r)
print("---")
cur.execute("SELECT id, title, type, status FROM ads")
for r in cur.fetchall(): print(r)
cur.close()
conn.close()
print("Done!")
