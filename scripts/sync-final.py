#!/usr/bin/env python3
"""稳定版全球同步 - 每条独立连接，错误会打印出来"""
import requests, time, psycopg2, sys

APP_ID="2899dccd"; APP_KEY="86ffc0dcf27cad6c95088854de203aed"
CID="6522fb87-5aa0-4621-b758-c8fe8478af8f"; AID="8df3fecd-5775-4361-ab3a-5c3b0f4a06a4"

COUNTRIES = {
    "us": ["New York", "San Francisco", "Seattle", "Austin", "Boston", "Los Angeles", "Chicago", "Denver", "Miami"],
    "gb": ["London", "Manchester", "Birmingham", "Edinburgh", "Bristol"],
    "de": ["Berlin", "Munich", "Frankfurt", "Hamburg"],
    "ca": ["Toronto", "Vancouver", "Montreal", "Ottawa"],
    "au": ["Sydney", "Melbourne", "Brisbane", "Perth"],
    "sg": ["Singapore"],
    "in": ["Bangalore", "Mumbai", "Hyderabad", "Delhi"],
    "fr": ["Paris", "Lyon"],
    "nl": ["Amsterdam", "Rotterdam"],
    "ch": ["Zurich"],
    "es": ["Madrid", "Barcelona"],
    "it": ["Milan", "Rome"],
    "pl": ["Warsaw"],
    "br": ["São Paulo"],
}

KEYWORDS = ["software engineer", "frontend developer", "data scientist", "devops engineer", "product manager"]

CURRENCY = {"gb":"GBP","us":"USD","de":"EUR","ca":"CAD","au":"AUD","sg":"SGD","in":"INR","fr":"EUR","nl":"EUR","ch":"CHF","se":"SEK","ie":"EUR","es":"EUR","it":"EUR","pl":"PLN","kr":"KRW","hk":"HKD","br":"BRL"}

inserted = 0
fetched = 0
errors = 0

for country, locations in COUNTRIES.items():
    for loc in locations:
        for kw in KEYWORDS:
            url = f"https://api.adzuna.com/v1/api/jobs/{country}/search/1"
            params = {"app_id": APP_ID, "app_key": APP_KEY, "results_per_page": 50, "what": kw, "where": loc}
            try:
                r = requests.get(url, params=params, timeout=15)
                if r.status_code == 404:
                    print(f"  [{country.upper()}] 404 - skipping")
                    pass
                if r.status_code == 429:
                    time.sleep(10)
                    r = requests.get(url, params=params, timeout=15)
                if r.status_code != 200:
                    continue
                data = r.json()
                jobs = data.get("results", [])
                if not jobs:
                    continue
                batch = 0
                for j in jobs:
                    try:
                        conn = psycopg2.connect("postgresql://jobquip:JQdb2024%21secure@localhost:5433/jobquip")
                        cur = conn.cursor()
                        slug = f"adzuna-{country}-{j['id']}"
                        title = j.get("title","")
                        desc = (j.get("description") or "")[:5000]
                        loc_name = j.get("location",{}).get("display_name", loc)
                        city = loc.split(",")[0].split("/")[0].strip()
                        smin = round(j["salary_min"]/12/1000) if j.get("salary_min") else None
                        smax = round(j["salary_max"]/12/1000) if j.get("salary_max") else None
                        ct = j.get("contract_type","")
                        emp = "FULL_TIME"
                        if ct == "part_time": emp = "PART_TIME"
                        elif ct == "contract": emp = "CONTRACT"
                        tl = title.lower()
                        exp = "MID"
                        if any(w in tl for w in ["senior","sr.","lead","principal","staff","head"]): exp = "SENIOR"
                        elif any(w in tl for w in ["junior","jr.","entry","intern","graduate"]): exp = "ENTRY"
                        cur.execute("""INSERT INTO jobs (slug,title,description,location,city,country,
                            "salaryMin","salaryMax","salaryCurrency","employmentType",experience,
                            "applyUrl","companyId","authorId",status)
                            VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
                            ON CONFLICT (slug) DO NOTHING""",
                            (slug,title,desc,loc_name,city,country.upper(),smin,smax,CURRENCY.get(country,"USD"),
                             emp,exp,j.get("redirect_url",""),CID,AID,"ACTIVE"))
                        conn.commit()
                        if cur.rowcount > 0: batch += 1; inserted += 1
                        cur.close(); conn.close()
                    except Exception as e:
                        errors += 1
                        if errors <= 5:
                            print(f"  DB ERR: {slug}: {e}", file=sys.stderr)
                        try: conn.rollback(); cur.close(); conn.close()
                        except: pass
                fetched += len(jobs)
                if batch > 0:
                    print(f"  [{country.upper()}] {loc}/{kw}: {len(jobs)} fetched, {batch} new (total {inserted})")
                time.sleep(2)
            except Exception as e:
                print(f"  [{country.upper()}] API ERR: {e}", file=sys.stderr)
        else:
            continue
        break

print(f"\nDONE: fetched={fetched} inserted={inserted} errors={errors}")
PYEOF