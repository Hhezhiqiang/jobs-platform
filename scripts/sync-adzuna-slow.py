#!/usr/bin/env python3
"""Adzuna 全球岗位同步 - 慢速版，控制 rate limit"""
import os
import requests
import time
import json
import psycopg2
import re
from urllib.parse import quote_plus

APP_ID = os.getenv("ADZUNA_APP_ID")
APP_KEY = os.getenv("ADZUNA_APP_KEY")
COMPANY_ID = os.getenv("ADZUNA_COMPANY_ID", "38416798-38f0-42ed-99fb-b35e4f76ee7f")
AUTHOR_ID = os.getenv("ADZUNA_AUTHOR_ID", "8df3fecd-5775-4361-ab3a-5c3b0f4a06a4")

DB = os.getenv("DATABASE_URL")

if not APP_ID or not APP_KEY:
    raise SystemExit("ADZUNA_APP_ID and ADZUNA_APP_KEY must be set")

if not DB:
    raise SystemExit("DATABASE_URL must be set")

COUNTRIES = {
    "gb": ["London", "Manchester", "Birmingham", "Edinburgh", "Bristol"],
    "us": ["New York", "San Francisco", "Seattle", "Austin", "Boston", "Los Angeles", "Chicago", "Denver", "Miami"],
    "de": ["Berlin", "Munich", "Frankfurt", "Hamburg"],
    "ca": ["Toronto", "Vancouver", "Montreal", "Ottawa"],
    "au": ["Sydney", "Melbourne", "Brisbane", "Perth"],
    "sg": ["Singapore"],
    "ae": ["Dubai", "Abu Dhabi"],
    "in": ["Bangalore", "Mumbai", "Hyderabad", "Delhi"],
    "fr": ["Paris", "Lyon"],
    "nl": ["Amsterdam"],
    "ch": ["Zurich"],
    "se": ["Stockholm"],
    "ie": ["Dublin"],
    "es": ["Madrid", "Barcelona"],
    "it": ["Milan", "Rome"],
    "pl": ["Warsaw"],
    "kr": ["Seoul"],
    "hk": ["Hong Kong"],
    "br": ["São Paulo"],
}

KEYWORDS = [
    "software engineer", "frontend developer", "backend developer", 
    "full stack developer", "data scientist", "devops engineer",
    "product manager", "cloud engineer", "security engineer",
    "machine learning engineer", "blockchain developer", "AI engineer",
    "web3 developer", "cybersecurity", "solutions architect",
]

CURRENCY_MAP = {
    "gb": "GBP", "us": "USD", "de": "EUR", "ca": "CAD", "au": "AUD",
    "sg": "SGD", "ae": "AED", "in": "INR", "fr": "EUR", "nl": "EUR",
    "ch": "CHF", "se": "SEK", "ie": "EUR", "es": "EUR", "it": "EUR",
    "pl": "PLN", "kr": "KRW", "hk": "HKD", "br": "BRL",
}

def connect_db():
    return psycopg2.connect(DB)

def insert_jobs(conn, jobs):
    if not jobs:
        return 0
    cur = conn.cursor()
    inserted = 0
    for job in jobs:
        try:
            cur.execute("""
                INSERT INTO jobs (slug, title, description, requirements, benefits,
                    location, city, country, "salaryMin", "salaryMax", "salaryCurrency",
                    "employmentType", "experienceLevel", "sourceUrl", "companyId", "authorId",
                    status, "createdAt", "updatedAt")
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, NOW(), NOW())
                ON CONFLICT (slug) DO NOTHING
            """, (
                job["slug"], job["title"], job["description"], job["requirements"],
                job["benefits"], job["location"], job["city"], job["country"],
                job["salaryMin"], job["salaryMax"], job["salaryCurrency"],
                job["employmentType"], job["experienceLevel"], job["sourceUrl"],
                job["companyId"], job["authorId"], job["status"]
            ))
            if cur.rowcount > 0:
                inserted += 1
        except Exception as e:
            pass
    conn.commit()
    cur.close()
    return inserted

def fetch_jobs(country, location, keyword, page=1):
    url = f"https://api.adzuna.com/v1/api/jobs/{country}/search/{page}"
    params = {
        "app_id": APP_ID,
        "app_key": APP_KEY,
        "results_per_page": 50,
        "what": keyword,
        "where": location,
        "content-type": "application/json",
    }
    try:
        r = requests.get(url, params=params, timeout=15)
        if r.status_code == 429:
            print(f"  ⚠️ rate limited, sleeping 30s...")
            time.sleep(30)
            return []
        if r.status_code != 200:
            return []
        data = r.json()
        return data.get("results", [])
    except Exception as e:
        return []

def transform(job, country, location):
    city = location.split(",")[0].strip() if "," in location else location
    slug = f"adzuna-{country}-{job['id']}"
    salary_min = job.get("salary_min")
    salary_max = job.get("salary_max")
    if salary_min:
        salary_min = round(salary_min / 12 / 1000)
    if salary_max:
        salary_max = round(salary_max / 12 / 1000)

    contract = job.get("contract_type", "")
    emp_type = "FULL_TIME"
    if contract == "part_time": emp_type = "PART_TIME"
    elif contract == "contract": emp_type = "CONTRACT"
    elif contract == "internship": emp_type = "INTERNSHIP"

    title = job.get("title", "").lower()
    if "senior" in title or "sr." in title or "lead" in title or "principal" in title:
        level = "SENIOR"
    elif "junior" in title or "jr." in title or "entry" in title or "intern" in title:
        level = "JUNIOR"
    else:
        level = "MID"

    return {
        "slug": slug,
        "title": job.get("title", ""),
        "description": job.get("description", "")[:5000] if job.get("description") else "",
        "requirements": "",
        "benefits": "",
        "location": location,
        "city": city,
        "country": country.upper(),
        "salaryMin": salary_min,
        "salaryMax": salary_max,
        "salaryCurrency": CURRENCY_MAP.get(country, "USD"),
        "employmentType": emp_type,
        "experienceLevel": level,
        "sourceUrl": job.get("redirect_url", ""),
        "companyId": COMPANY_ID,
        "authorId": AUTHOR_ID,
        "status": "ACTIVE",
    }

def main():
    conn = connect_db()
    total_inserted = 0
    total_fetched = 0

    # Count total work
    total_requests = 0
    for country, locations in COUNTRIES.items():
        for loc in locations:
            for kw in KEYWORDS:
                total_requests += 2  # 2 pages per combo

    print(f"📊 总计: {len(COUNTRIES)} 国 × {sum(len(v) for v in COUNTRIES.values())} 城市 × {len(KEYWORDS)} 关键词 × 2 页 = {total_requests} 次请求")
    print(f"   预计耗时: ~{total_requests * 2 // 60} 分钟 (每次 2s 间隔)\n")

    request_count = 0
    for country, locations in COUNTRIES.items():
        for location in locations:
            for keyword in KEYWORDS:
                for page in [1, 2]:
                    request_count += 1
                    jobs = fetch_jobs(country, location, keyword, page)
                    if jobs:
                        transformed = [transform(j, country, location) for j in jobs]
                        inserted = insert_jobs(conn, transformed)
                        total_fetched += len(jobs)
                        total_inserted += inserted
                        if inserted > 0:
                            print(f"  [{country.upper()}] {location}/{keyword} p{page}: {len(jobs)} 条, 新增 {inserted}")
                    else:
                        print(f"  [{country.upper()}] {location}/{keyword} p{page}: 0 条")

                    # Progress
                    if request_count % 50 == 0:
                        print(f"  📈 进度: {request_count}/{total_requests} | 获取={total_fetched} 新增={total_inserted}")

                    time.sleep(2)  # Rate limit protection

    conn.close()
    print(f"\n✅ 完成! 获取={total_fetched} 新增={total_inserted}")

if __name__ == "__main__":
    main()
