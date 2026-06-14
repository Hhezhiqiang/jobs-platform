#!/bin/bash
# ================================================================
# jobquip.com 地理位置分析优化 - 一键部署脚本
# 在服务器 root@8.217.226.103 上执行 (密码: Hh123456789.)
# ================================================================

set -e
export HOME=/root
cd /opt/jobs-platform

echo "========================================="
echo "  GEO 优化部署脚本"
echo "========================================="

# ===== 1. 写入数据库迁移文件 =====
echo "[1/5] 写入数据库迁移..."
cat > /tmp/geo-migrate.sql << 'SQL'
CREATE INDEX IF NOT EXISTS idx_page_views_geo ON page_views (country, city, "createdAt" DESC) WHERE country IS NOT NULL AND city IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_page_views_created ON page_views ("createdAt" DESC);
CREATE INDEX IF NOT EXISTS idx_page_views_event ON page_views (eventType, "createdAt" DESC) WHERE eventType IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_page_views_ip ON page_views (ip, "createdAt" DESC) WHERE ip IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_page_views_missing_geo ON page_views ("createdAt" DESC) WHERE (country IS NULL OR country = '') AND ip IS NOT NULL;
SQL
echo "   geo-migrate.sql OK"

# ===== 2. 写入 geo-location.ts =====
echo "[2/5] 写入 geo-location.ts..."
cat > src/lib/geo-location.ts << 'TSFILE'
import { prisma } from "@/lib/prisma";
import { logger } from '@/lib/logger';

const geoCache = new Map<string, { country: string; city: string; timestamp: number }>();
const CACHE_TTL = 24 * 60 * 60 * 1000;
let activeRequests = 0;
const MAX_CONCURRENT = 5;
const requestQueue: (() => void)[] = [];

function waitForSlot(): Promise<void> {
  if (activeRequests < MAX_CONCURRENT) { activeRequests++; return Promise.resolve(); }
  return new Promise(resolve => { requestQueue.push(() => { activeRequests++; resolve(); }); });
}
function releaseSlot() { activeRequests--; const next = requestQueue.shift(); if (next) next(); }

const BOT_UA_PATTERNS = ['bot','crawler','spider','scraper','headless','curl','wget','python-requests','axios','node-fetch','googlebot','bingbot','baiduspider','yandexbot','duckduckbot','slurp','ahrefsbot','semrushbot','mj12bot','dotbot','pinterest','facebookexternalhit','twitterbot','rogerbot','exabot','ia_archiver'];
const DATACENTER_IP_PREFIXES = ['34.','35.','104.','130.','146.','52.','54.','13.','18.','3.','15.','16.','99.','108.','136.','139.','142.','144.','40.','42.','48.','52.','64.','65.','66.'];

export interface GeoLocation { country: string; city: string; region?: string; isp?: string; }

export function isBotTraffic(userAgent: string, ip: string): boolean {
  if (userAgent) { const ua = userAgent.toLowerCase(); if (ua.length < 20 && !ua.includes('mozilla')) return true; for (const p of BOT_UA_PATTERNS) { if (ua.includes(p)) return true; } }
  if (ip) { const parts = ip.split('.'); if (parts.length === 4) { const prefix = parts[0]+'.'+parts[1]+'.'; for (const dc of DATACENTER_IP_PREFIXES) { if (ip.startsWith(dc)) return true; } } }
  return false;
}

function isPrivateIP(ip: string): boolean {
  if (!ip || ip==='127.0.0.1' || ip==='::1') return true;
  if (ip.startsWith('192.168.') || ip.startsWith('10.')) return true;
  const parts = ip.split('.'); if (parts.length===4 && parts[0]==='172') { const s = parseInt(parts[1]); if (s>=16 && s<=31) return true; }
  return false;
}

async function fetchIpApiGeo(ip: string): Promise<GeoLocation | null> {
  try {
    const r = await fetch('http://ip-api.com/json/'+ip+'?fields=status,message,country,countryCode,region,regionName,city,isp,org', { headers: {'User-Agent':'Mozilla/5.0 (compatible; JobPlatform/1.0)'}, signal: AbortSignal.timeout(5000) });
    if (!r.ok) return null;
    const d = await r.json();
    if (d.status==='fail') { if (d.message?.includes('private range')) return {country:'Private',city:'Private'}; return null; }
    return { country: d.country||'Unknown', city: d.city||d.regionName||'Unknown', region: d.regionName, isp: d.isp };
  } catch (e) { return null; }
}

async function fetchIpapiCoGeo(ip: string): Promise<GeoLocation | null> {
  try {
    const r = await fetch('https://ipapi.co/'+ip+'/json/', { headers: {'User-Agent':'Mozilla/5.0 (compatible; JobPlatform/1.0)'}, signal: AbortSignal.timeout(5000) });
    if (!r.ok) return null;
    const d = await r.json();
    if (d.error) return null;
    return { country: d.country_name||'Unknown', city: d.city||d.region||'Unknown', region: d.region, isp: d.org };
  } catch (e) { return null; }
}

async function fetchGeoLocation(ip: string): Promise<GeoLocation | null> {
  if (isPrivateIP(ip)) return { country:'Local', city:'Local' };
  const cached = geoCache.get(ip);
  if (cached && Date.now()-cached.timestamp < CACHE_TTL) return { country: cached.country, city: cached.city };
  await waitForSlot();
  try {
    const sources = [{name:'ip-api',fn:()=>fetchIpApiGeo(ip)},{name:'ipapi.co',fn:()=>fetchIpapiCoGeo(ip)}];
    for (const s of sources) { try { const r = await s.fn(); if (r) { geoCache.set(ip,{country:r.country,city:r.city,timestamp:Date.now()}); return r; } } catch { continue; } }
    return null;
  } finally { releaseSlot(); }
}

export async function updatePageViewGeoLocation(viewId: string, ip: string, userAgent?: string): Promise<void> {
  try {
    const isBot = userAgent ? isBotTraffic(userAgent, ip) : false;
    const geo = await fetchGeoLocation(ip);
    await prisma.page_views.update({ where: {id:viewId}, data: { country: geo?.country || (isBot?'Bot':null), city: geo?.city || null, eventType: isBot?'BOT':undefined } });
  } catch (e) { logger.error("[Geo] update error:", e); }
}

export async function batchUpdateGeoLocations(limit: number = 100): Promise<{total:number;updated:number;failed:number;botsFound:number}> {
  let total=0, updated=0, failed=0, botsFound=0;
  try {
    const views = await prisma.page_views.findMany({ where: { OR:[{country:null},{country:''}], ip:{not:null} }, take:limit, orderBy:{createdAt:'desc'}, select:{id:true,ip:true,userAgent:true} });
    total = views.length;
    const BATCH_SIZE = 5;
    for (let i=0; i<views.length; i+=BATCH_SIZE) {
      const batch = views.slice(i, i+BATCH_SIZE);
      const results = await Promise.allSettled(batch.map(async (v) => {
        const isBot = v.userAgent ? isBotTraffic(v.userAgent, v.ip!) : false;
        if (isBot) return {id:v.id,isBot:true};
        const geo = await fetchGeoLocation(v.ip!);
        if (geo) { await prisma.page_views.update({where:{id:v.id},data:{country:geo.country,city:geo.city}}); return {id:v.id,isBot:false,updated:true}; }
        return {id:v.id,isBot:false,updated:false};
      }));
      for (const r of results) {
        if (r.status==='fulfilled') { if (r.value.isBot) { botsFound++; await prisma.page_views.update({where:{id:r.value.id},data:{eventType:'BOT',country:'Bot',city:'Bot'}}).catch(()=>{}); } else if (r.value.updated) updated++; else failed++; }
        else failed++;
      }
      if (i+BATCH_SIZE < views.length) await new Promise(r=>setTimeout(r,500));
    }
  } catch (e) { logger.error("[Geo] batch:", e); }
  return {total,updated,failed,botsFound};
}

export async function getGeoStats(): Promise<{totalWithGeo:number;totalWithoutGeo:number;totalBots:number;coverage:string}> {
  const [withGeo, withoutGeo, bots] = await Promise.all([
    prisma.page_views.count({ where: { AND:[{country:{not:null}},{country:{not:''}},{eventType:{not:'BOT'}}] } }),
    prisma.page_views.count({ where: { OR:[{country:null},{country:''}], ip:{not:null} } }),
    prisma.page_views.count({ where: {eventType:'BOT'} })
  ]);
  const total = withGeo+withoutGeo;
  return { totalWithGeo:withGeo, totalWithoutGeo:withoutGeo, totalBots:bots, coverage: total>0 ? ((withGeo/total)*100).toFixed(1)+"%" : "0%" };
}

export { isPrivateIP };
TSFILE
echo "   geo-location.ts OK"

# ===== 3. 写入 geo-route.ts =====
echo "[3/5] 写入 geo-route.ts..."
cat > "src/app/api/admin/analytics/geo/route.ts" << 'TSFILE'
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { subDays, startOfDay, endOfDay } from "date-fns";
import { logger } from '@/lib/logger';

export const dynamic = "force-dynamic";
export const maxDuration = 30;

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== "ADMIN") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get("days") || "30");
    const startDate = startOfDay(subDays(new Date(), days));
    const endDate = endOfDay(new Date());
    const excludeBots = searchParams.get("excludeBots") !== "false";

    const baseWhere: any = { createdAt: { gte: startDate, lte: endDate }, ip: { not: null } };
    if (excludeBots) baseWhere.eventType = { not: 'BOT' };

    const [totalViews, uniqueIpRows, countryData, cityData, dailyRows, countryCityData] = await Promise.all([
      prisma.page_views.count({ where: baseWhere }),
      prisma.page_views.findMany({ where: baseWhere, select: { ip: true }, distinct: ['ip'] }),
      prisma.page_views.groupBy({ by: ['country'], where: { ...baseWhere, country: { not: null } }, _count: true, orderBy: { _count: { country: 'desc' } }, take: 50 }),
      prisma.page_views.groupBy({ by: ['city', 'country'], where: { ...baseWhere, city: { not: null }, country: { not: null } }, _count: true, orderBy: { _count: { city: 'desc' } }, take: 50 }),
      prisma.page_views.findMany({ where: { ...baseWhere, createdAt: { gte: startOfDay(subDays(new Date(), Math.min(days, 14))), lte: endDate } }, select: { country: true, createdAt: true } }),
      prisma.page_views.groupBy({ by: ['country', 'city'], where: { ...baseWhere, country: { not: null }, city: { not: null } }, _count: true, orderBy: [{ country: 'asc' }, { _count: { city: 'desc' } }] }),
    ]);

    const uniqueIps = uniqueIpRows.length;
    const countries = countryData.filter(c=>c.country).map(c=>({country:c.country,count:c._count,percentage:totalViews>0?((c._count/totalViews)*100).toFixed(1)+"%":"0%"}));
    const cities = cityData.filter(c=>c.city&&c.country).map(c=>({city:c.city!,country:c.country!,count:c._count}));

    const dailyMap = new Map<string, Map<string, number>>();
    for (const r of dailyRows) { const d = r.createdAt.toISOString().split('T')[0]; const c = r.country||'Unknown'; if(!dailyMap.has(d)) dailyMap.set(d,new Map()); dailyMap.get(d)!.set(c,(dailyMap.get(d)!.get(c)||0)+1); }
    const dailyBreakdown = Array.from(dailyMap.entries()).map(([date,cc])=>({date,countries:Object.fromEntries(cc),total:Array.from(cc.values()).reduce((a,b)=>a+b,0)})).sort((a,b)=>a.date.localeCompare(b.date));

    const ccMap = new Map<string, Map<string, number>>();
    for (const r of countryCityData) { if(!r.country||!r.city) continue; if(!ccMap.has(r.country)) ccMap.set(r.country,new Map()); ccMap.get(r.country)!.set(r.city,r._count); }
    const topCitiesByCountry = Array.from(ccMap.entries()).map(([c,ct])=>({country:c,cities:Array.from(ct.entries()).map(([n,cnt])=>({name:n,count:cnt})).sort((a,b)=>b.count-a.count).slice(0,5)})).filter(c=>c.cities.length>0).slice(0,10);

    const botsCount = excludeBots ? await prisma.page_views.count({where:{createdAt:{gte:startDate,lte:endDate},eventType:'BOT'}}) : 0;

    return NextResponse.json({
      summary: { totalViews, uniqueIps, uniqueCountries: countries.length, botsCount, botPercentage: totalViews>0?((botsCount/(totalViews+botsCount))*100).toFixed(1)+"%":"0%", period: days+"天", excludeBots },
      countries, cities, dailyBreakdown, topCitiesByCountry,
    });
  } catch (error: any) { logger.error("[geo] Error:", error); return NextResponse.json({error:"获取数据失败",message:error.message},{status:500}); }
}
TSFILE
echo "   geo-route.ts OK"

# ===== 4. 写入前端组件 =====
echo "[4/5] 写入 geo-analytics-client.tsx..."
cat > "src/app/[locale]/admin/analytics/geo/components/geo-analytics-client.tsx" << 'TSFILE'
"use client";
import { useState, useEffect, useCallback, useMemo } from "react";
import { Globe, MapPin, Users, Eye, Clock, BarChart3, PieChart, TrendingUp, Bot, Filter, RefreshCw, ChevronDown, ChevronUp } from "lucide-react";

interface GeoData {
  summary: { totalViews: number; uniqueCountries: number; uniqueIps: number; botsCount: number; botPercentage: string; period: string; excludeBots: boolean };
  countries: Array<{ country: string; count: number; percentage: string }>;
  cities: Array<{ city: string; country: string; count: number }>;
  dailyBreakdown: Array<{ date: string; countries: Record<string,number>; total: number }>;
  topCitiesByCountry: Array<{ country: string; cities: Array<{ name: string; count: number }> }>;
}

const COLORS = ['#6366f1','#8b5cf6','#a855f7','#d946ef','#ec4899','#f43f5e','#ef4444','#f97316','#eab308','#22c55e','#14b8a6','#06b6d4','#0ea5e9','#3b82f6','#6366f1'];

function StatCard({ icon: Icon, title, value, subtitle, color }: any) {
  return (
    <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div><p className="text-sm text-gray-500 mb-1">{title}</p><p className="text-2xl font-bold text-gray-900">{value}</p>{subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}</div>
        <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: color + '20' }}><Icon className="w-5 h-5" style={{ color }} /></div>
      </div>
    </div>
  );
}

function HorizontalBarChart({ data, limit = 10 }: { data: Array<{ label: string; value: number; subLabel?: string }>; limit?: number }) {
  const maxValue = Math.max(...data.map(d => d.value), 1);
  return (
    <div className="space-y-2">{data.slice(0, limit).map((item, i) => (
      <div key={i} className="flex items-center gap-3">
        <div className="w-24 text-right flex-shrink-0"><span className="text-sm text-gray-700 truncate block" title={item.label}>{item.label}</span>{item.subLabel && <span className="text-xs text-gray-400">{item.subLabel}</span>}</div>
        <div className="flex-1"><div className="h-6 bg-gray-50 rounded-md overflow-hidden"><div className="h-full rounded-md flex items-center pl-2 transition-all duration-700 ease-out" style={{ width: ((item.value/maxValue)*100)+'%', backgroundColor: COLORS[i % COLORS.length] }}><span className="text-xs text-white font-medium">{item.value.toLocaleString()}</span></div></div></div>
      </div>
    ))}</div>
  );
}

function DonutChart({ data, centerText }: { data: Array<{ label: string; value: number; color: string }>; centerText?: string }) {
  const total = data.reduce((s,d)=>s+d.value,0); const R=80, r=40; let a=-90;
  const slices = data.map(item=>{const ang=(item.value/total)*360;const sa=a;const ea=a+ang;a=ea;const sr=(sa*Math.PI)/180;const er=(ea*Math.PI)/180;const x1=100+R*Math.cos(sr);const y1=100+R*Math.sin(sr);const x2=100+R*Math.cos(er);const y2=100+R*Math.sin(er);const x1i=100+r*Math.cos(sr);const y1i=100+r*Math.sin(sr);const x2i=100+r*Math.cos(er);const y2i=100+r*Math.sin(er);const la=ang>180?1:0;return{...item,path:'M '+x1+' '+y1+' A '+R+' '+R+' 0 '+la+' 1 '+x2+' '+y2+' L '+x2i+' '+y2i+' A '+r+' '+r+' 0 '+la+' 0 '+x1i+' '+y1i+' Z',percentage:((item.value/total)*100).toFixed(1)};});
  return (
    <div className="flex flex-col items-center">
      <svg viewBox="0 0 200 200" className="w-48 h-48">{slices.map((s,i)=><path key={i} d={s.path} fill={s.color} stroke="white" strokeWidth="1"/>)}{centerText && <><text x="100" y="97" textAnchor="middle" className="text-lg font-bold" fill="#374151">{centerText}</text><text x="100" y="115" textAnchor="middle" className="text-xs" fill="#9ca3af">Total</text></>}</svg>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-3">{slices.slice(0,6).map((s,i)=><div key={i} className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{backgroundColor:s.color}}/><span className="text-xs text-gray-600 truncate">{s.label}</span><span className="text-xs text-gray-400">{s.percentage}%</span></div>)}</div>
    </div>
  );
}

function TrendLineChart({ data }: { data: Array<{ date: string; total: number }> }) {
  const maxV = Math.max(...data.map(d=>d.total),1); const W=600, H=200; const P={top:20,right:20,bottom:30,left:50}; const cw=W-P.left-P.right; const ch=H-P.top-P.bottom;
  const pts = data.map((d,i)=>({x:P.left+(i/Math.max(data.length-1,1))*cw, y:P.top+ch-(d.total/maxV)*ch}));
  const lp = pts.map((p,i)=>`${i===0?'M':'L'} ${p.x} ${p.y}`).join(' ');
  const ap = lp+' L '+pts[pts.length-1].x+' '+(P.top+ch)+' L '+pts[0].x+' '+(P.top+ch)+' Z';
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
      <defs><linearGradient id="ag" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#6366f1" stopOpacity="0.3"/><stop offset="100%" stopColor="#6366f1" stopOpacity="0"/></linearGradient></defs>
      {[0,0.25,0.5,0.75,1].map((rt,i)=>{const y=P.top+ch-rt*ch;return <g key={i}><line x1={P.left} y1={y} x2={W-P.right} y2={y} stroke="#f3f4f6" strokeWidth="1"/><text x={P.left-8} y={y+4} textAnchor="end" className="text-[10px]" fill="#9ca3af">{Math.round(maxV*rt)}</text></g>})}
      <path d={ap} fill="url(#ag)"/><path d={lp} fill="none" stroke="#6366f1" strokeWidth="2"/>
      {pts.map((p,i)=><circle key={i} cx={p.x} cy={p.y} r="3" fill="#6366f1" stroke="white" strokeWidth="1"/>)}
      {data.filter((_,i)=>i%Math.ceil(data.length/7)===0).map((d,i)=>{const idx=data.indexOf(d);const x=P.left+(idx/Math.max(data.length-1,1))*cw;return <text key={i} x={x} y={H-5} textAnchor="middle" className="text-[10px]" fill="#9ca3af">{d.date.slice(5)}</text>})}
    </svg>
  );
}

export function GeoAnalyticsClient() {
  const [data, setData] = useState<GeoData | null>(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);
  const [excludeBots, setExcludeBots] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedCountries, setExpandedCountries] = useState<Set<string>>(new Set());

  const fetchGeoData = useCallback(async () => {
    try { setLoading(true); setError(null); const r = await fetch('/api/admin/analytics/geo?days='+days+'&excludeBots='+excludeBots); if(!r.ok){const e=await r.json().catch(()=>({}));throw new Error(e.error||'HTTP '+r.status)} setData(await r.json()); } catch(e:any){setError(e.message||'Error')} finally {setLoading(false);}
  }, [days, excludeBots]);

  useEffect(() => { fetchGeoData(); }, [fetchGeoData]);

  const pieData = useMemo(() => { if(!data) return []; const top10 = data.countries.slice(0,10); const others = data.countries.slice(10).reduce((s,c)=>s+c.count,0); const r = top10.map((c,i)=>({label:c.country,value:c.count,color:COLORS[i%COLORS.length]})); if(others>0) r.push({label:'Others',value:others,color:'#e5e7eb'}); return r; }, [data]);

  if (loading && !data) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"/></div>;
  if (error) return <div className="flex flex-col items-center justify-center h-64 text-center"><p className="text-red-500 mb-2">加载失败</p><p className="text-sm text-gray-500 mb-4">{error}</p><button onClick={fetchGeoData} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700">重试</button></div>;
  if (!data) return null;

  const { summary } = data;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2 bg-white rounded-lg border px-3 py-1.5"><Clock className="w-4 h-4 text-gray-400"/><select value={days} onChange={e=>setDays(Number(e.target.value))} className="text-sm bg-transparent border-none outline-none text-gray-700"><option value={7}>最近7天</option><option value={14}>最近14天</option><option value={30}>最近30天</option><option value={90}>最近90天</option></select></div>
        <label className="flex items-center gap-2 bg-white rounded-lg border px-3 py-1.5 cursor-pointer"><Bot className={'w-4 h-4 '+(excludeBots?'text-green-500':'text-gray-400')}/><span className="text-sm text-gray-700">排除爬虫</span><input type="checkbox" checked={excludeBots} onChange={e=>setExcludeBots(e.target.checked)} className="sr-only"/></label>
        <button onClick={fetchGeoData} className="flex items-center gap-1.5 px-3 py-1.5 bg-white rounded-lg border text-sm text-gray-600 hover:bg-gray-50"><RefreshCw className="w-4 h-4"/>刷新</button>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        <StatCard icon={Eye} title="总浏览量" value={summary.totalViews.toLocaleString()} color="#6366f1"/>
        <StatCard icon={Users} title="独立IP" value={summary.uniqueIps.toLocaleString()} color="#8b5cf6"/>
        <StatCard icon={Globe} title="国家数" value={summary.uniqueCountries} color="#22c55e"/>
        <StatCard icon={Bot} title="爬虫流量" value={summary.botsCount.toLocaleString()} subtitle={summary.botPercentage} color="#f97316"/>
        <StatCard icon={Clock} title="统计周期" value={summary.period} color="#06b6d4"/>
        <StatCard icon={Filter} title="数据过滤" value={summary.excludeBots?'已过滤':'全量'} color="#14b8a6"/>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl p-5 shadow-sm border"><h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2"><Globe className="w-4 h-4 text-indigo-500"/>国家/地区分布</h3>{data.countries.length>0?<DonutChart data={pieData} centerText={summary.uniqueCountries.toString()}/>:<p className="text-gray-400 text-center py-8">暂无数据</p>}</div>
        <div className="bg-white rounded-xl p-5 shadow-sm border"><h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2"><BarChart3 className="w-4 h-4 text-indigo-500"/>Top 10 国家/地区</h3>{data.countries.length>0?<HorizontalBarChart data={data.countries.slice(0,10).map(c=>({label:c.country,value:c.count,subLabel:c.percentage}))}/>:<p className="text-gray-400 text-center py-8">暂无数据</p>}</div>
      </div>
      {data.dailyBreakdown.length>1 && <div className="bg-white rounded-xl p-5 shadow-sm border"><h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2"><TrendingUp className="w-4 h-4 text-indigo-500"/>每日访问趋势</h3><TrendLineChart data={data.dailyBreakdown}/></div>}
      <div className="bg-white rounded-xl p-5 shadow-sm border"><h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2"><MapPin className="w-4 h-4 text-indigo-500"/>Top 15 城市</h3>{data.cities.length>0?<HorizontalBarChart data={data.cities.slice(0,15).map(c=>({label:c.city+', '+c.country,value:c.count}))} limit={15}/>:<p className="text-gray-400 text-center py-8">暂无数据</p>}</div>
      {data.topCitiesByCountry.length>0 && <div className="bg-white rounded-xl p-5 shadow-sm border"><h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2"><PieChart className="w-4 h-4 text-indigo-500"/>各国家 Top 城市</h3><div className="space-y-3">{data.topCitiesByCountry.map((c,i)=><div key={i} className="border rounded-lg p-3"><button className="flex items-center justify-between w-full text-left" onClick={()=>{const n=new Set(expandedCountries);expandedCountries.has(c.country)?n.delete(c.country):n.add(c.country);setExpandedCountries(n)}}><span className="font-medium text-gray-700">{c.country}</span>{expandedCountries.has(c.country)?<ChevronUp className="w-4 h-4 text-gray-400"/>:<ChevronDown className="w-4 h-4 text-gray-400"/>}</button>{expandedCountries.has(c.country)&&<div className="mt-2 space-y-1">{c.cities.map((ct,j)=><div key={j} className="flex justify-between text-sm"><span className="text-gray-500">{ct.name}</span><span className="text-gray-700 font-medium">{ct.count.toLocaleString()}</span></div>)}</div>}</div>)}</div></div>}
    </div>
  );
}
TSFILE
echo "   geo-analytics-client.tsx OK"

# ===== 5. 数据库迁移 + 构建部署 =====
echo "[5/5] 执行数据库迁移并构建..."
DB_URL=$(grep DATABASE_URL .env.local | sed 's/DATABASE_URL=//' | tr -d '"'"'"' | tr -d ' ')
psql "$DB_URL" -f /tmp/geo-migrate.sql 2>&1
echo "   Migration done"

echo ""
echo "========================================="
echo "  开始构建 Next.js (约60-90秒)..."
echo "========================================="
nohup bash -c "cd /opt/jobs-platform && npx next build > /tmp/geo-build.log 2>&1 && pkill -f 'next start' 2>/dev/null; sleep 2; nohup npx next start -p 3000 > /tmp/next.log 2>&1 &" &
echo "  Build 已在后台启动"

sleep 5
echo ""
echo "✓ 部署脚本执行完毕"
echo "  请等待60秒后检查: tail -10 /tmp/geo-build.log"