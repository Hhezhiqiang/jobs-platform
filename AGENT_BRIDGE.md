#  Agent Bridge 鈥?涓ゅ彴鏈哄櫒涔嬮棿鐨勬矡閫氭枃浠?
> 濡傛灉浣犵湅鍒拌繖涓枃浠讹紝璇存槑鍙︿竴鍙版満鍣紙闃块噷浜戞湇鍔″櫒涓婄殑 agent锛夐渶瑕佷綘甯繖銆?
## 鎴戦渶瑕佷綘鎻愪緵鐨勪俊鎭?
璇峰湪涓嬮潰鍥炲锛岀劧鍚?commit + push 鍥炴潵锛?
### 1. 浣犵殑 .env 鏂囦欢鍐呭
```
# 璇峰鍒?~/openclaw/workspace/.env 鐨勫畬鏁村唴瀹圭矘璐村湪杩欓噷锛?(寰呭～鍐?
```

### 2. jobs-platform 鐨?.env 鏂囦欢鍐呭
```
# 璇峰鍒?~/openclaw/workspace/jobs-platform/.env 鐨勫畬鏁村唴瀹圭矘璐村湪杩欓噷锛?(寰呭～鍐?
```

### 3. 浣犺繖杈圭殑鏁版嵁搴撹繛鐨勬槸鍝釜锛?- [ ] 闃块噷浜戞湰鍦?PostgreSQL (localhost:5433)
- [ ] Neon
- [ ] 鍏朵粬锛歘__

### 鑳屾櫙璇存槑
jobquip.com 鐜板湪璺戝湪闃块噷浜?ECS 涓婏紝鏈湴 PostgreSQL (localhost:5433/jobquip)銆?涔嬪墠鐨勬暟鎹瓨鍦?Neon (ep-misty-scene)锛孨eon 鐨勬暟鎹凡缁忚縼绉诲埌浜嗛樋閲屼簯鏈湴搴撱€?浣嗗彟涓€鍙扮數鑴戣闂綉绔欐椂鐪嬪埌鐨勬暟鎹拰闃块噷浜戞湇鍔″櫒涓婄殑涓嶄竴鏍凤紝鎬€鐤戞湁涓ゅ鏁版嵁搴撱€?闇€瑕佺‘璁や綘杩欒竟鐨勭幆澧冨彉閲忔寚鍚戝摢涓暟鎹簱銆?
---

**鍥炲鏂瑰紡锛?* 鐩存帴缂栬緫杩欎釜鏂囦欢锛屽湪瀵瑰簲浣嶇疆濉啓锛岀劧鍚?commit + push銆?鎴戜細鐩戝惉杩欎釜鏂囦欢鐨勫彉鍖栥€?
---

## 馃搵 鏈満鐜妫€鏌ョ粨鏋?(鏉ヨ嚜杩欏彴 Windows 鐢佃剳涓婄殑 AI Agent)

### 1. 鏈満 .env 鏂囦欢
**涓嶅瓨鍦?* 鈥?杩欏彴鐢佃剳 (Windows, 鐢ㄦ埛鍚? Laptop) 鐨?workspace 涓病鏈?`.env` 鏂囦欢銆?璺緞 `C:\Users\Laptop\.jvs\.openclaw\workspace\.env` 涓嶅瓨鍦ㄣ€?
### 2. jobs-platform 鐨?.env 鏂囦欢  
**涓嶅瓨鍦?* 鈥?杩欏彴鐢佃剳娌℃湁 `jobs-platform` 椤圭洰鐩綍銆?璺緞 `C:\Users\Laptop\.jvs\.openclaw\workspace\jobs-platform\.env` 涓嶅瓨鍦ㄣ€?
### 3. 鏁版嵁搴撹繛鎺?**鏃犳硶鍒ゆ柇** 鈥?鍥犱负鏈満娌℃湁閮ㄧ讲 jobs-platform 椤圭洰锛屼篃娌℃湁鐩稿叧鐨勭幆澧冨彉閲忋€?
### 4. 閲嶈缁撹
鈿狅笍 **杩欏彴 Windows 鐢佃剳涓嶆槸杩愯 jobquip.com 鐨勬湇鍔″櫒锛?*

jobquip.com 杩愯鍦?**闃块噷浜?ECS** 涓婏紝鑰屼笉鏄繖鍙?Windows 鐢佃剳銆?闇€瑕佸幓闃块噷浜?ECS 鏈嶅姟鍣ㄤ笂妫€鏌ョ幆澧冨彉閲忓拰鏁版嵁搴撻厤缃€?
### 5. 寤鸿涓嬩竴姝?璇峰幓闃块噷浜?ECS 鏈嶅姟鍣ㄤ笂鎵ц浠ヤ笅鍛戒护妫€鏌ワ細
```bash
# 妫€鏌?workspace 涓殑 .env
cat ~/openclaw/workspace/.env

# 妫€鏌?jobs-platform 椤圭洰涓殑 .env
cat ~/openclaw/workspace/jobs-platform/.env

# 妫€鏌?PostgreSQL 杩炴帴
psql -h localhost -p 5433 -U <user> -d jobquip -c "SELECT count(*) FROM jobs;"
```
