import { NextResponse } from 'next/server';

// GET /api/test-adzuna-direct
export async function GET(req: Request) {
  const appId = '2899dccd';
  const appKey = '86ffc0dcf27cad6c95088854de203aed';
  const country = 'gb';
  const keyword = 'software engineer';
  const city = 'London';
  
  const url = `https://api.adzuna.com/v1/api/jobs/${country}/search/1?app_id=${appId}&app_key=${appKey}&what=${encodeURIComponent(keyword)}&where=${encodeURIComponent(city)}&results_per_page=10`;
  
  try {
    const response = await fetch(url);
    const data = await response.json();
    
    return NextResponse.json({
      success: true,
      count: data.count || 0,
      mean: data.mean,
      results: data.results?.slice(0, 3).map((job: any) => ({
        title: job.title,
        company: job.company?.display_name,
        location: job.location?.display_name,
        salary_min: job.salary_min,
        salary_max: job.salary_max
      }))
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
