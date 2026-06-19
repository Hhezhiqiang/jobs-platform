# 批量申请功能 - 部署指南

## 文件清单（已就绪，无需手动创建）

| 文件 | GitHub 路径 |
|------|------------|
| 批量申请 API | src/app/api/applications/batch/route.ts |
| 前端组件 | src/components/batch-apply-bar.tsx |
| 部署脚本 | scripts/deploy-batch-ui.sh |

## 部署步骤（飞书 agent 在服务器上执行）

```bash
cd /opt/jobs-platform

# 1. 下载最新文件
curl -sL https://raw.githubusercontent.com/Hhezhiqiang/jobs-platform/main/src/components/batch-apply-bar.tsx -o src/components/batch-apply-bar.tsx
curl -sL https://raw.githubusercontent.com/Hhezhiqiang/jobs-platform/main/src/app/api/applications/batch/route.ts -o src/app/api/applications/batch/route.ts
mkdir -p src/app/api/applications/batch

# 2. 重新构建
npx next build

# 3. 重启服务
pkill -f 'next start'
sleep 2
nohup npx next start -p 3000 > /tmp/next.log 2>&1 &

# 4. 验证
sleep 5
curl -so /dev/null -w "HTTP:%{http_code}" https://jobquip.com/
```

## 在岗位列表页使用（需要手动添加到页面代码）

在 `src/components/jobs-page-client.tsx` 中添加：

### 1. 顶部 import 添加
```
import { BatchApplyBar, JobCheckbox } from "@/components/batch-apply-bar";
```

### 2. 在组件函数内添加状态
```
const [selectedJobs, setSelectedJobs] = useState<string[]>([]);
const toggleSelect = (id: string) => {
  setSelectedJobs(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
};
```

### 3. 在每个 JobCard 前加勾选框
```
<JobCheckbox checked={selectedJobs.includes(job.id)} onChange={() => toggleSelect(job.id)} />
```

### 4. 在页面底部加批量操作栏
```
<BatchApplyBar selectedIds={selectedJobs} onClear={() => setSelectedJobs([])} onSuccess={() => setSelectedJobs([])} />
```

## 测试 API

```js
fetch('/api/applications/batch', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({jobIds: ['xxx', 'yyy'], email: 'test@example.com'})
}).then(r => r.json()).then(console.log)
```