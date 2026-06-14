import requests, time, psycopg2

APP_ID = "2899dccd"
APP_KEY = "86ffc0dcf27cad6c95088854de203aed"
CID = "6522fb87-5aa0-4621-b758-c8fe8478af8f"
AID = "8df3fecd-5775-4361-ab3a-5c3b0f4a06a4"

COUNTRIES = {
    "fr": ["Paris", "Lyon"],
    "nl": ["Amsterdam", "Rotterdam"],
    "ch": ["Zurich"],
    "es": ["Madrid", "Barcelona"],
    "it": ["Milan", "Rome"],
    "pl": ["Warsaw"],
    "br": ["São Paulo"],
}
KEYWORDS = ["software engineer", "frontend developer", "data scientist", "devops engineer", "product manager"]
CURRENCY = {"fr": "EUR", "nl": "EUR", "ch": "CHF", "es": "EUR", "it": "EUR", "pl": "PLN", "br": "BRL"}

inserted = 0
fetched = 0
errors = 0

for country, locations in COUNTRIES.items():
    for loc in locations:
        for kw in KEYWORDS:
            url = f"https://api.adzuna.com/v1/api/jobs/{country}/search/1"
            params = {
                "app_id": APP_ID,
                "app_key": APP_KEY,
                "results_per_page": 50,
                "what": kw,
                "where": loc,
            }
            try:
                r = requests.get(url, params=params, timeout=15)
                if r.status_code == 404:
                    continue
                if r.status_code == 429:
                    time.sleep(10)
                    r = requests.get(url, params=params, timeout=15)
                if r.status_code != 200:
                    continue
                jobs = r.json().get("results", [])
                if not jobs:
                    continue
                batch = 0
                for j in jobs:
                    try:
                        conn = psycopg2.connect(
                            "postgresql://jobquip:JQdb2024%21secure@localhost:5433/jobquip"
                        )
                        cur = conn.cursor()
                        job_id = j["id"]
                        slug = f"adzuna-{country}-{job_id}"
                        title = j.get("title", "")
                        desc = (j.get("description") or "")[:5000]
                        loc_name = j.get("location", {}).get("display_name", loc)
                        city = loc
                        smin = round(j["salary_min"] / 12 / 1000) if j.get("salary_min") else None
                        smax = round(j["salary_max"] / 12 / 1000) if j.get("salary_max") else None
                        ct = j.get("contract_type", "")
                        emp = "FULL_TIME"
                        if ct == "part_time":
                            emp = "PART_TIME"
                        elif ct == "contract":
                            emp = "CONTRACT"
                        tl = title.lower()
                        exp = "MID"
                        senior_words = ["senior", "sr.", "lead", "principal", "staff", "head"]
                        junior_words = ["junior", "jr.", "entry", "intern", "graduate"]
                        if any(w in tl for w in senior_words):
                            exp = "SENIOR"
                        elif any(w in tl for w in junior_words):
                            exp = "ENTRY"
                        cur.execute(
                            """INSERT INTO jobs (slug,title,description,location,city,country,
                                "salaryMin","salaryMax","salaryCurrency","employmentType",experience,
                                "applyUrl","companyId","authorId",status)
                                VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
                                ON CONFLICT (slug) DO NOTHING""",
                            (
                                slug, title, desc, loc_name, city, country.upper(),
                                smin, smax, CURRENCY.get(country, "USD"),
                                emp, exp, j.get("redirect_url", ""), CID, AID, "ACTIVE",
                            ),
                        )
                        conn.commit()
                        if cur.rowcount > 0:
                            batch += 1
                            inserted += 1
                        cur.close()
                        conn.close()
                    except Exception:
                        errors += 1
                        try:
                            conn.rollback()
                            cur.close()
                            conn.close()
                        except Exception:
                            pass
                fetched += len(jobs)
                print(f"  [{country.upper()}] {loc}/{kw}: ins={batch} tot={inserted}")
                time.sleep(2)
            except Exception:
                pass

print(f"DONE: fetched={fetched} inserted={inserted} errors={errors}")