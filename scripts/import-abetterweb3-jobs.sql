-- ABetterWeb3 3月/4月招聘岗位 SQL 导入脚本
-- 生成时间: 2026-04-10

-- 先确保有管理员用户 (如果没有，请先创建)
-- INSERT INTO users (id, email, name, password, role, status, "createdAt", "updatedAt") 
-- VALUES ('admin_user_id', 'admin@jobs-platform.com', '系统管理员', 'hashed_password', 'ADMIN', 'ACTIVE', NOW(), NOW());

-- ============================================
-- 1. 创建公司
-- ============================================

INSERT INTO companies (id, name, slug, industry, description, location, website, "isVerified", "createdAt", "updatedAt")
VALUES 
  ('gate_io', 'Gate', 'gate', 'CEX/交易所', 'Gate - CEX/交易所领域公司，全球领先的数字资产交易平台', 'Global', 'https://www.gate.io', true, NOW(), NOW()),
  ('lbank', 'LBank', 'lbank', 'CEX/交易所', 'LBank - CEX/交易所领域公司', 'Global', '', true, NOW(), NOW()),
  ('mexc', 'MEXC', 'mexc', 'CEX/交易所', 'MEXC - CEX/交易所领域公司', 'Global', 'https://www.mexc.com', true, NOW(), NOW()),
  ('bitget', 'Bitget', 'bitget', 'CEX/交易所', 'Bitget - CEX/交易所领域公司', 'Global', 'https://www.bitget.com', true, NOW(), NOW()),
  ('synfutures', 'SynFutures', 'synfutures', 'DeFi/DEX', 'SynFutures - DeFi/DEX领域公司', 'Hong Kong', 'https://www.synfutures.com', true, NOW(), NOW()),
  ('bedrock', 'Bedrock', 'bedrock', 'DeFi/Layer1', 'Bedrock - DeFi/Layer1领域公司', 'Singapore', '', true, NOW(), NOW()),
  ('pharos', 'Pharos', 'pharos', 'DeFi/DEX', 'Pharos - DeFi/DEX领域公司', 'Shenzhen', '', true, NOW(), NOW()),
  ('0g_labs', '0G Labs', '0g-labs', 'Layer1', '0G Labs - Layer1领域公司', 'Global', '', true, NOW(), NOW()),
  ('soonetwork', 'SOONetwork', 'soonetwork', 'Layer2', 'SOONetwork - Layer2领域公司', 'Singapore', '', true, NOW(), NOW()),
  ('trust_wallet', 'Trust Wallet', 'trust-wallet', '钱包', 'Trust Wallet - 钱包领域公司', 'Global', 'https://trustwallet.com', true, NOW(), NOW()),
  ('byterum', 'Byterum', 'byterum', 'AI+Web3', 'Byterum - AI+Web3领域公司', 'Global', '', true, NOW(), NOW()),
  ('tradeos', 'TradeOS', 'tradeos', 'AI+Web3', 'TradeOS - AI+Web3领域公司', 'Shenzhen', '', true, NOW(), NOW()),
  ('ltp_liquiditytech', 'LTP｜LiquidityTech', 'ltp-liquiditytech', 'Broker/量化', 'LTP｜LiquidityTech - Broker/量化领域公司', 'Shanghai', '', true, NOW(), NOW())
ON CONFLICT (slug) DO UPDATE SET 
  name = EXCLUDED.name,
  industry = EXCLUDED.industry,
  "updatedAt" = NOW();

-- ============================================
-- 2. 创建职位 (请替换 'admin_user_id' 为实际管理员用户ID)
-- ============================================

-- 4月更新岗位
INSERT INTO jobs (id, title, slug, description, location, "employmentType", "salaryMin", "salaryMax", "salaryCurrency", "salaryPeriod", "applyUrl", status, "isRemote", "isFeatured", "companyId", "authorId", tags, "datePosted", "createdAt", "updatedAt")
VALUES 
  -- Gate - 4月8日更新
  ('gate_001', 'Business & Onboarding Specialist', 'gate-business-onboarding-specialist-1744257600000-0', 
   E'岗位要求：本科，华人（中英流利），做过材料递交、合规供应商的资料整理、海外公司注册和管理\n\n投递方式：@Cathy_cc/@HR_Juju\n更新时间：2026.4.8', 
   'Global', 'FULL_TIME', 5000, 8000, 'USD', 'YEAR', 'mailto:hr@gate.io', 'ACTIVE', true, false, 'gate_io', 'admin_user_id', ARRAY['Business', 'Onboarding', 'Compliance', '远程'], NOW(), NOW(), NOW()),

  ('gate_002', 'Senior Legal Counsel', 'gate-senior-legal-counsel-1744257600001-1', 
   E'岗位要求：本科，英语流利，多年法务相关工作经验，其中至少2年区块链行业工作经验\n\n投递方式：@Cathy_cc/@HR_Juju\n更新时间：2026.4.8', 
   'Global', 'FULL_TIME', 8000, 15000, 'USD', 'YEAR', 'mailto:hr@gate.io', 'ACTIVE', true, false, 'gate_io', 'admin_user_id', ARRAY['Legal', 'Counsel', '法务', '远程'], NOW(), NOW(), NOW()),

  ('gate_003', '工业衍生品设计师', 'gate-industrial-derivative-designer-1744257600002-2', 
   E'岗位要求：本科，有海外设计经验，3年以上衍生品设计经验；需附带作品集\n\n投递方式：@Cathy_cc/@HR_Juju\n更新时间：2026.4.8', 
   'Global', 'FULL_TIME', 5000, 10000, 'USD', 'YEAR', 'mailto:hr@gate.io', 'ACTIVE', true, false, 'gate_io', 'admin_user_id', ARRAY['Design', '衍生品', '设计师', '远程'], NOW(), NOW(), NOW()),

  -- LBank - 4月
  ('lbank_001', '合约测试工程师', 'lbank-contract-testing-engineer-1744257600003-3', 
   E'岗位职责：\n1. 负责合约交易系统的功能测试\n2. 编写测试用例和测试报告\n3. 与开发团队协作定位问题\n\n投递方式：@mandy_zhao66\n更新时间：2026.4月', 
   'Global', 'FULL_TIME', 4000, 8000, 'USD', 'YEAR', 'https://t.me/mandy_zhao66', 'ACTIVE', true, false, 'lbank', 'admin_user_id', ARRAY['Testing', '合约', '交易所', '远程'], NOW(), NOW(), NOW()),

  ('lbank_002', 'AI大模型基建工程师', 'lbank-ai-infrastructure-engineer-1744257600004-4', 
   E'岗位职责：\n1. 负责AI大模型基础设施建设\n2. 优化模型训练和推理性能\n3. 搭建MLops平台\n\n投递方式：@mandy_zhao66\n更新时间：2026.4月', 
   'Global', 'FULL_TIME', 8000, 15000, 'USD', 'YEAR', 'https://t.me/mandy_zhao66', 'ACTIVE', true, false, 'lbank', 'admin_user_id', ARRAY['AI', 'ML', '大模型', '基建', '远程'], NOW(), NOW(), NOW()),

  -- MEXC - 4月急招
  ('mexc_001', 'UI/UX设计师', 'mexc-ui-ux-designer-1744257600005-5', 
   E'本周急招岗位🔥\n\n岗位要求：\n1. 3年以上UI/UX设计经验\n2. 有金融科技或交易所设计经验优先\n3. 熟悉Figma、Sketch等设计工具\n\n投递方式：TG: @Shelby_MEXC_HR\n邮箱：shelby.yu@mexc.com\n更新时间：2026.4月', 
   'Global', 'FULL_TIME', 4000, 8000, 'USD', 'YEAR', 'mailto:shelby.yu@mexc.com', 'ACTIVE', true, true, 'mexc', 'admin_user_id', ARRAY['UI/UX', '设计', '急招', '远程'], NOW(), NOW(), NOW()),

  ('mexc_002', '交易风控分析师', 'mexc-trading-risk-analyst-1744257600006-6', 
   E'本周急招岗位🔥\n\n岗位要求：\n1. 3年以上金融风控经验\n2. 熟悉交易所风控规则和模型\n3. 数据分析能力强\n\n投递方式：TG: @Shelby_MEXC_HR\n邮箱：shelby.yu@mexc.com\n更新时间：2026.4月', 
   'Global', 'FULL_TIME', 6000, 12000, 'USD', 'YEAR', 'mailto:shelby.yu@mexc.com', 'ACTIVE', true, true, 'mexc', 'admin_user_id', ARRAY['Risk', '风控', '交易', '分析师', '急招', '远程'], NOW(), NOW(), NOW()),

  ('mexc_003', '用户增长运营经理', 'mexc-user-growth-manager-1744257600007-7', 
   E'本周急招岗位🔥\n\n岗位要求：\n1. 5年以上用户增长经验\n2. 熟悉海外用户获取渠道\n3. 数据驱动，结果导向\n\n投递方式：TG: @Shelby_MEXC_HR\n邮箱：shelby.yu@mexc.com\n更新时间：2026.4月', 
   'Global', 'FULL_TIME', 5000, 10000, 'USD', 'YEAR', 'mailto:shelby.yu@mexc.com', 'ACTIVE', true, true, 'mexc', 'admin_user_id', ARRAY['Growth', '增长', '运营', '经理', '急招', '远程'], NOW(), NOW(), NOW()),

  -- Bitget - 4月
  ('bitget_001', '大前端开发工程师', 'bitget-senior-frontend-engineer-1744257600008-8', 
   E'岗位亮点：居家办公\n\n岗位要求：\n1. 3年以上前端开发经验\n2. 熟悉React/Vue等框架\n3. 有币圈/金融经验优先\n\n投递方式：@bobby2048\n更新时间：2026.4月', 
   'Global', 'FULL_TIME', 6000, 12000, 'USD', 'YEAR', 'https://t.me/bobby2048', 'ACTIVE', true, false, 'bitget', 'admin_user_id', ARRAY['Frontend', '前端', 'React', 'Vue', '居家办公'], NOW(), NOW(), NOW()),

  ('bitget_002', 'iOS开发工程师', 'bitget-ios-engineer-1744257600009-9', 
   E'岗位亮点：居家办公\n\n岗位要求：\n1. 3年以上iOS开发经验\n2. 熟悉Swift/Objective-C\n3. 有交易所APP开发经验优先\n\n投递方式：@bobby2048\n更新时间：2026.4月', 
   'Global', 'FULL_TIME', 6000, 12000, 'USD', 'YEAR', 'https://t.me/bobby2048', 'ACTIVE', true, false, 'bitget', 'admin_user_id', ARRAY['iOS', '移动端', 'Swift', '居家办公'], NOW(), NOW(), NOW()),

  -- SynFutures - 4月
  ('synfutures_001', 'Head of Product for DEX', 'synfutures-head-of-product-dex-1744257600010-10', 
   E'💰 薪资待遇：$200K+团队token分配+绩效奖金\n\n岗位要求：\n1. 5年以上产品管理经验\n2. 3年以上DeFi/DEX产品经验\n3. 对衍生品交易有深入理解\n4. 英文可作为工作语言\n\n投递方式：Hiring@synfutures.xyz\n地点：香港', 
   'Hong Kong', 'FULL_TIME', 15000, 25000, 'USD', 'YEAR', 'mailto:Hiring@synfutures.xyz', 'ACTIVE', false, false, 'synfutures', 'admin_user_id', ARRAY['Product', 'Head of Product', 'DEX', 'DeFi', '高薪'], NOW(), NOW(), NOW()),

  ('synfutures_002', '资深DeFi智能合约工程师', 'synfutures-senior-defi-smart-contract-1744257600011-11', 
   E'💰 薪资待遇：$5000u+\n\n岗位要求：\n1. 3年以上智能合约开发经验\n2. 精通Solidity\n3. 有DeFi协议开发经验\n4. 熟悉安全审计流程\n\n投递方式：Hiring@synfutures.xyz\n地点：香港', 
   'Hong Kong', 'FULL_TIME', 5000, 10000, 'USD', 'YEAR', 'mailto:Hiring@synfutures.xyz', 'ACTIVE', false, false, 'synfutures', 'admin_user_id', ARRAY['Smart Contract', 'Solidity', 'DeFi', '工程师'], NOW(), NOW(), NOW()),

  -- Bedrock - 4月急聘
  ('bedrock_001', 'Institutional BD', 'bedrock-institutional-bd-1744257600012-12', 
   E'🔥🔥 急聘岗位\n\n岗位职责：\n开拓机构客户与合作伙伴｜staking&DeFi\n\n岗位要求：\n1. 中英文流利\n2. 地点灵活\n3. 有机构客户资源优先\n\n投递方式：\nTG: @tastelikelove\nEmail: samantha@rockx.com\n地点：新加坡/香港/马来西亚/台湾（GMT+8）', 
   'Singapore', 'FULL_TIME', 8000, 15000, 'USD', 'YEAR', 'mailto:samantha@rockx.com', 'ACTIVE', true, true, 'bedrock', 'admin_user_id', ARRAY['BD', 'Business Development', '机构', '急聘', '远程'], NOW(), NOW(), NOW()),

  -- Pharos - 4月
  ('pharos_001', 'DEX智能合约开发工程师', 'pharos-dex-smart-contract-engineer-1744257600013-13', 
   E'💰 薪资待遇：$120K\n\n技术栈：Solidity/Rust/Move\n\n岗位要求：\n1. 3年以上智能合约开发经验\n2. 熟悉DEX协议原理\n3. 有安全审计意识\n\nJD和投递链接：https://docs.google.com/document/d/1uh9iMzsT1pz1EfsJ9nqDDOrmtMO2tmKDK2N5kYqL5rQ/edit?tab=t.0\n地点：深圳\nTG: @rileyweb3', 
   'Shenzhen', 'FULL_TIME', 8000, 12000, 'USD', 'YEAR', 'https://docs.google.com/document/d/1uh9iMzsT1pz1EfsJ9nqDDOrmtMO2tmKDK2N5kYqL5rQ/edit?tab=t.0', 'ACTIVE', false, false, 'pharos', 'admin_user_id', ARRAY['Smart Contract', 'Solidity', 'Rust', 'Move', 'DEX'], NOW(), NOW(), NOW()),

  -- 0G Labs - 4月
  ('0g_labs_001', 'Blockchain Core Engineer', '0g-labs-blockchain-core-engineer-1744257600014-14', 
   E'岗位要求：\n1. 5-10年区块链核心开发经验\n2. 精通Rust/Go/C++\n3. 有Layer1/共识算法开发经验\n\n投递方式：@ktcheng1\n更新时间：2026.4月', 
   'Global', 'FULL_TIME', 10000, 20000, 'USD', 'YEAR', 'https://t.me/ktcheng1', 'ACTIVE', true, false, '0g_labs', 'admin_user_id', ARRAY['Blockchain', 'Core', 'Layer1', 'Rust', '远程'], NOW(), NOW(), NOW()),

  -- SOONetwork - 4月
  ('soonetwork_001', 'AI Vibecoding Application Engineer', 'soonetwork-ai-vibecoding-engineer-1744257600015-15', 
   E'Base: Singapore\nRemote: 支持远程\n\n岗位职责：\nAI应用开发工程师\n\n投递方式：\nTG: @ningruiTG\nTG: @YvonneLi504\n更新时间：2026.4月', 
   'Singapore', 'FULL_TIME', 6000, 12000, 'USD', 'YEAR', 'https://t.me/ningruiTG', 'ACTIVE', true, false, 'soonetwork', 'admin_user_id', ARRAY['AI', 'Vibecoding', 'Layer2', '远程'], NOW(), NOW(), NOW()),

  -- Trust Wallet - 4月
  ('trust_wallet_001', 'Senior Data Engineer', 'trust-wallet-senior-data-engineer-1744257600016-16', 
   E'岗位要求：\n1. 5年以上数据工程经验\n2. 精通AWS/Databricks/Data Pipeline\n3. 英文面试，英文可作为工作语言\n4. 国内互联网大厂经验加分\n\n投递方式：ying.cao@trustwallet.com\n地点：Global Remote\n更新时间：2026.4月', 
   'Global', 'FULL_TIME', 8000, 15000, 'USD', 'YEAR', 'mailto:ying.cao@trustwallet.com', 'ACTIVE', true, false, 'trust_wallet', 'admin_user_id', ARRAY['Data Engineer', 'AWS', 'Databricks', '钱包', '远程'], NOW(), NOW(), NOW()),

  ('trust_wallet_002', 'Senior Product Manager', 'trust-wallet-senior-product-manager-1744257600017-17', 
   E'岗位要求：\n1. 5年以上产品管理经验\n2. 有钱包产品经验\n3. 英文面试，英文可作为工作语言\n4. 国内互联网大厂经验加分\n\n投递方式：ying.cao@trustwallet.com\n地点：Global Remote\n更新时间：2026.4月', 
   'Global', 'FULL_TIME', 8000, 15000, 'USD', 'YEAR', 'mailto:ying.cao@trustwallet.com', 'ACTIVE', true, false, 'trust_wallet', 'admin_user_id', ARRAY['Product Manager', 'Wallet', '产品经理', '远程'], NOW(), NOW(), NOW()),

  -- Byterum - 4月
  ('byterum_001', 'AI Agent开发工程师', 'byterum-ai-agent-engineer-1744257600018-18', 
   E'公司介绍：\nMinara.ai - 全球首个「入金→分析→决策→执行」全闭环金融AI智能体\nDMind.ai - Web3垂直大模型\n\n岗位要求：\n1. 熟悉LangChain、OpenAI API、Agent架构\n2. 有AI Agent开发经验\n3. 远程可沟通\n\n其他岗位：\n- 运维工程师/SRE\n- 后端开发工程师\n- 移动端前端开发\n- 测试工程师\n- 高级产品经理\n\n投递方式：\n邮箱: hr@byterum.com\nTG: @daisy51518\n地点：Onsite/远程混合\n更新时间：2026.4月', 
   'Global', 'FULL_TIME', 6000, 12000, 'USD', 'YEAR', 'mailto:hr@byterum.com', 'ACTIVE', true, false, 'byterum', 'admin_user_id', ARRAY['AI', 'Agent', 'LangChain', 'Web3', '远程'], NOW(), NOW(), NOW()),

  -- TradeOS - 4月
  ('tradeos_001', '全栈工程师(应届生)', 'tradeos-full-stack-fresh-graduate-1744257600019-19', 
   E'⚠️ 只接受2025-2026应届生投递\n\n技术栈：\nTypeScript、React、Next.js、Postgres DB\n\n岗位要求：\n1. 熟练掌握以上技术栈\n2. 具备problem-solving能力、自驱、好奇心\n3. 有实习、AI相关经历加分\n\n另一岗位：增长市场经理\n- 熟悉美股/外汇/黄金/crypto市场（至少两个）\n- 具备市场、增长、KOL合作经验\n\n投递方式：Telegram @xkai33\n地点：深圳/杭州\n更新时间：2026.4月', 
   'Shenzhen', 'FULL_TIME', 3000, 6000, 'USD', 'YEAR', 'https://t.me/xkai33', 'ACTIVE', false, false, 'tradeos', 'admin_user_id', ARRAY['Full Stack', '应届生', 'TypeScript', 'React', 'Next.js'], NOW(), NOW(), NOW()),

  -- 3月更新岗位
  ('ltp_001', '高级Java开发工程师', 'ltp-senior-java-engineer-1744257600020-20', 
   E'📅 更新日期：2026/03/24\n\nBase：上海&深圳\n现场办公 ⬆️ 薪资Open\n\n岗位要求：\n1. 有交易所开发经验\n2. 拥有钱包、现货、期货、衍生品交易、理财、借贷、合约交易、杠杆、清算、结算等交易系统开发经验\n3. 5年以上Java开发经验\n\n投递方式：\nHR@liquiditytech.com\n备注来源：Abetterweb3\n地点：上海&深圳\n更新时间：2026.3.24', 
   'Shanghai', 'FULL_TIME', 8000, 20000, 'USD', 'YEAR', 'mailto:HR@liquiditytech.com', 'ACTIVE', false, false, 'ltp_liquiditytech', 'admin_user_id', ARRAY['Java', '交易所', '交易系统', '高级'], NOW(), NOW(), NOW()),

  ('ltp_002', '风控模型工程师', 'ltp-risk-model-engineer-1744257600021-21', 
   E'📅 更新日期：2026/03/24\n\nBase：上海\n要求：985/211/双一流或QS前100本科以上（硕士优先考虑），接受应届生投递\n\n专业要求：\n数学、统计学、金融工程专业优先\n\n岗位要求：\n1. 有量化研究、数据分析或金融建模相关实习/项目经验优先\n2. 参与量化风控核心模型的开发与维护\n\n投递方式：\nHR@liquiditytech.com\n备注来源：Abetterweb3\n地点：上海\n更新时间：2026.3.24', 
   'Shanghai', 'FULL_TIME', 6000, 15000, 'USD', 'YEAR', 'mailto:HR@liquiditytech.com', 'ACTIVE', false, false, 'ltp_liquiditytech', 'admin_user_id', ARRAY['Risk Model', '风控', '量化', '数学', '统计'], NOW(), NOW(), NOW())

ON CONFLICT (id) DO UPDATE SET 
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  "salaryMin" = EXCLUDED."salaryMin",
  "salaryMax" = EXCLUDED."salaryMax",
  "updatedAt" = NOW();

-- ============================================
-- 3. 统计导入结果
-- ============================================

SELECT 
  '导入完成' as status,
  COUNT(*) as total_jobs,
  COUNT(*) FILTER (WHERE "companyId" IN ('gate_io', 'lbank', 'mexc', 'bitget')) as cex_jobs,
  COUNT(*) FILTER (WHERE "companyId" IN ('synfutures', 'bedrock', 'pharos')) as defi_jobs,
  COUNT(*) FILTER (WHERE "companyId" IN ('0g_labs', 'soonetwork')) as layer_jobs,
  COUNT(*) FILTER (WHERE "companyId" IN ('trust_wallet')) as wallet_jobs,
  COUNT(*) FILTER (WHERE "companyId" IN ('byterum', 'tradeos')) as ai_jobs,
  COUNT(*) FILTER (WHERE "companyId" IN ('ltp_liquiditytech')) as quant_jobs,
  COUNT(*) FILTER (WHERE "isFeatured" = true) as hot_jobs
FROM jobs 
WHERE id LIKE 'gate_%' 
   OR id LIKE 'lbank_%' 
   OR id LIKE 'mexc_%' 
   OR id LIKE 'bitget_%'
   OR id LIKE 'synfutures_%'
   OR id LIKE 'bedrock_%'
   OR id LIKE 'pharos_%'
   OR id LIKE '0g_labs_%'
   OR id LIKE 'soonetwork_%'
   OR id LIKE 'trust_wallet_%'
   OR id LIKE 'byterum_%'
   OR id LIKE 'tradeos_%'
   OR id LIKE 'ltp_%';
