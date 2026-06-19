#!/bin/bash
# 导入 65 个 Web3 实习/初级岗位
export HOME=/root
cd /opt/jobs-platform

curl -sL https://raw.githubusercontent.com/Hhezhiqiang/jobs-platform/main/data/go-junior-jobs.json -o /tmp/go-jobs.json

cat > /tmp/import-go.mjs << 'JS'
import { PrismaClient } from "@prisma/client";
import { readFileSync } from "fs";
const prisma = new PrismaClient();
const jobs = JSON.parse(readFileSync("/tmp/go-jobs.json", "utf-8"));
console.log(`Importing ${jobs.length} jobs...`);
const ADMIN = "aaa2604d-96d5-431d-b4a8-cb7e5455e103";
const cmap = new Map();
const ec = await prisma.companies.findMany({select:{id:true,slug:true,name:true}});
for (const c of ec) { cmap.set(c.slug,c.id); cmap.set(c.name.toLowerCase(),c.id); }
let created=0,skipped=0,cc=0;
for (const job of jobs) {
  try {
    let cid = cmap.get(job.company.toLowerCase());
    if (!cid) {
      const slug = job.company.toLowerCase().replace(/[^a-z0-9]/g,"").substring(0,50);
      try { const nc = await prisma.companies.create({data:{name:job.company,slug,industry:"Technology/Web3",size:"100-500",location:job.location||"Global",verificationStatus:"APPROVED"}}); cmap.set(job.company.toLowerCase(),nc.id); cid=nc.id; cc++; }
      catch(e){ if(e.code==="P2002"){const ex=await prisma.companies.findUnique({where:{slug}});if(ex){cmap.set(job.company.toLowerCase(),ex.id);cid=ex.id;}} }
    }
    const desc = (job.description||"").substring(0,2000);
    const ts = (job.title||"").replace(/[^a-zA-Z0-9]/g,"-").toLowerCase().substring(0,40);
    const slug = ts+"-"+Date.now()+"-"+Math.random().toString(36).slice(2,6);
    await prisma.jobs.create({data:{title:job.title,titleEn:job.title,description:desc,descriptionEn:desc,slug,employmentType:"FULL_TIME",experience:"ENTRY",salaryCurrency:"USD",salaryPeriod:"YEAR",location:job.location||"",city:"",country:"US",isRemote:job.isRemote||false,applyUrl:job.applyUrl||"",status:"ACTIVE",isFeatured:false,keywords:["web3","blockchain","crypto","intern","junior"],companyId:cid,authorId:ADMIN}});
    created++;
    if (created%20===0) console.log(`  ${created}/${jobs.length}`);
  } catch(e) { if(e.code==="P2002") skipped++; else console.error(`Skip: ${job.title}`); skipped++; }
}
console.log(`Done: ${created} created, ${skipped} skipped, ${cc} companies`);
await prisma.$disconnect();
JS

node /tmp/import-go.mjs
echo "IMPORT DONE"