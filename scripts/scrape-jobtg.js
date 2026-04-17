const puppeteer = require('puppeteer');

async function scrapeJobtg() {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
  
  const allJobs = [];
  const pagesToScrape = 10; // 10 pages = ~150 jobs, should cover 60 days
  
  for (let pageNum = 1; pageNum <= pagesToScrape; pageNum++) {
    const url = pageNum === 1 
      ? 'https://www.jobtg.ai/job/' 
      : `https://www.jobtg.ai/job/page/${pageNum}/`;
    
    console.log(`\n=== 正在抓取第 ${pageNum} 页 ===`);
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
    await page.waitForSelector('a[href^="/job/"]', { timeout: 10000 });
    
    // Get all job listing links
    const jobLinks = await page.$$eval('a[href^="/job/"]', links => 
      links.map(link => ({
        href: link.getAttribute('href'),
        title: link.textContent.trim()
      })).filter(l => l.title && l.title.length > 2)
    );
    
    console.log(`找到 ${jobLinks.length} 个职位`);
    
    // For each job on this page, get details
    for (let i = 0; i < Math.min(jobLinks.length, 15); i++) {
      const jobLink = jobLinks[i];
      if (!jobLink.href) continue;
      
      try {
        const detailUrl = `https://www.jobtg.ai${jobLink.href}`;
        await page.goto(detailUrl, { waitUntil: 'networkidle2', timeout: 30000 });
        await page.waitForSelector('body', { timeout: 10000 });
        
        // Extract job details
        const jobData = await page.evaluate(() => {
          const getText = (sel) => {
            const el = document.querySelector(sel);
            return el ? el.textContent.trim() : '';
          };
          
          const getAllText = (sel) => {
            const el = document.querySelector(sel);
            return el ? el.textContent : '';
          };
          
          // Title
          const title = document.querySelector('h1')?.textContent?.trim() || '';
          
          // Salary and meta
          const salaryMatch = document.body.textContent?.match(/(\d+-\d+K|面议)/);
          const salary = salaryMatch ? salaryMatch[1] : '面议';
          
          // Location
          const locationMatch = document.body.textContent?.match(/([\u4e00-\u9fa5]+[-·][\u4e00-\u9fa5]+市)/);
          const location = locationMatch ? locationMatch[1] : '';
          
          // Experience
          const expMatch = document.body.textContent?.match(/(\d+-\d+年|经验不限)/);
          const experience = expMatch ? expMatch[1] : '经验不限';
          
          // Education
          const eduMatch = document.body.textContent?.match(/(大专|本科|硕士|博士|学历不限)/);
          const education = eduMatch ? eduMatch[1] : '学历不限';
          
          // Remote
          const isRemote = document.body.textContent?.includes('可接受远程') || false;
          
          // Benefits
          const benefitsMatch = document.body.textContent?.match(/(年假|年终奖|餐补|房补|医疗保险|年度分红|定期体检|下午茶)[\s,，]*(年假|年终奖|餐补|房补|医疗保险|年度分红|定期体检|下午茶)?/);
          const benefits = benefitsMatch ? benefitsMatch[0] : '';
          
          // Job description (full text)
          const descEl = document.querySelector('body');
          const fullText = descEl ? descEl.textContent : '';
          
          // Extract job description section
          const descMatch = fullText.match(/职位描述[\s\S]*?职位要求[\s\S]*?(?=工作地址|特别申明|举报)/);
          const jobDescription = descMatch ? descMatch[0] : '';
          
          // Extract requirements
          const reqMatch = fullText.match(/职位要求[\s\S]*?(?=工作地址|特别申明|举报)/);
          const requirements = reqMatch ? reqMatch[0] : '';
          
          // Company info
          const companyMatch = fullText.match(/公司简介[\s\S]*?(?=公司规模|网站须知|©)/);
          const companyInfo = companyMatch ? companyMatch[0] : '';
          
          // Company size
          const sizeMatch = fullText.match(/公司规模[\s\S]*?(\d+-\d+人)/);
          const companySize = sizeMatch ? sizeMatch[1] : '';
          
          // HR info
          const hrMatch = fullText.match(/职位发布者[\s\S]*?([A-Za-z\u4e00-\u9fa5]+)[\s\S]*?(HR|人事经理|人事总监|经理|HRBP|招聘专业)[\s\S]*?(.+?小时在线|.+?天前在线)/);
          const hrName = hrMatch ? hrMatch[1] : '';
          const hrTitle = hrMatch ? hrMatch[2] : '';
          const hrOnline = hrMatch ? hrMatch[3] : '';
          
          // Recruitment count
          const recruitMatch = fullText.match(/招聘(\d+-\d+人)/);
          const recruitCount = recruitMatch ? recruitMatch[1] : '';
          
          // Update time
          const updateMatch = fullText.match(/更新于(\d+[小时天周月年前])/);
          const updateTime = updateMatch ? updateMatch[1] : '';
          
          // Tags
          const tags = [];
          if (fullText.includes('年假')) tags.push('年假');
          if (fullText.includes('年终奖')) tags.push('年终奖');
          if (fullText.includes('餐补')) tags.push('餐补');
          if (fullText.includes('房补')) tags.push('房补');
          if (fullText.includes('医疗保险')) tags.push('医疗保险');
          if (fullText.includes('年度分红')) tags.push('年度分红');
          if (fullText.includes('定期体检')) tags.push('定期体检');
          if (fullText.includes('下午茶')) tags.push('下午茶');
          if (fullText.includes('可接受远程')) tags.push('远程办公');
          
          return {
            title,
            salary,
            location,
            experience,
            education,
            remote: isRemote,
            benefits: tags.join(', '),
            jobDescription: jobDescription.trim(),
            requirements: requirements.trim(),
            companyInfo: companyInfo.trim(),
            companySize,
            hrName,
            hrTitle,
            hrOnline,
            recruitCount,
            updateTime,
            url: window.location.href,
            scrapedAt: new Date().toISOString()
          };
        });
        
        if (jobData.title) {
          allJobs.push(jobData);
          console.log(`  ✅ ${jobData.title} | ${jobData.salary} | ${jobData.location} | HR: ${jobData.hrName}`);
        }
        
        // Rate limiting
        await new Promise(r => setTimeout(r, 2000));
        
      } catch (err) {
        console.log(`  ❌ Error: ${err.message}`);
      }
    }
    
    await new Promise(r => setTimeout(r, 3000));
  }
  
  await browser.close();
  return allJobs;
}

scrapeJobtg().then(jobs => {
  const fs = require('fs');
  fs.writeFileSync('/tmp/jobtg_full_data.json', JSON.stringify(jobs, null, 2));
  console.log(`\n\n=== 抓取完成！共 ${jobs.length} 个职位 ===`);
  console.log('数据已保存到 /tmp/jobtg_full_data.json');
}).catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
