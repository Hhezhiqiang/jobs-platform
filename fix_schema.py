import re

with open("prisma/schema.prisma", "r") as f:
    content = f.read()

model_map = {
    "contact_unlock_orders": "ContactUnlockOrder",
    "promoters": "Promoter",
    "promoter_links": "PromoterLink",
    "user_referrals": "UserReferral",
    "commission_records": "CommissionRecord",
    "commission_adjustments": "CommissionAdjustment",
    "withdrawal_records": "WithdrawalRecord",
}

# 1. Rename model declarations
for old, new in model_map.items():
    content = re.sub(rf"^model {old} {{", f"model {new} {{", content, flags=re.MULTILINE)

# 2. Rename relation field types
lines = content.splitlines()
result = []
for line in lines:
    for old, new in model_map.items():
        line = re.sub(rf"\b{old}\?\b", f"{new}?", line)
        line = re.sub(rf"\b{old}\[\]\b", f"{new}[]", line)
        # match standalone old model name used as type at end of line (before @relation or end)
        line = re.sub(rf"\b{old}\b(?=\s+@relation|\s*$)", f"{new}", line)
    result.append(line)
content = "\n".join(result)

# 3. Append @@map to each renamed model block
snake_map = {
    "ContactUnlockOrder": "contact_unlock_orders",
    "Promoter": "promoters",
    "PromoterLink": "promoter_links",
    "UserReferral": "user_referrals",
    "CommissionRecord": "commission_records",
    "CommissionAdjustment": "commission_adjustments",
    "WithdrawalRecord": "withdrawal_records",
}

for new_name, snake in snake_map.items():
    def repl(m, name=new_name, s=snake):
        body = m.group(1).rstrip()
        if not body.endswith("\n"):
            body += "\n"
        return f"model {name} {{\n{body}  @@map(\"{s}\")\n}}"
    pattern = rf"model {new_name} \{{(.*?)\n\}}"
    content = re.sub(pattern, repl, content, flags=re.DOTALL)

with open("prisma/schema.prisma", "w") as f:
    f.write(content)

print("Done")
