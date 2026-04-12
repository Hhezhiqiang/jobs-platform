import re

with open("prisma/schema.prisma", "r") as f:
    content = f.read()

replacements = [
    ("commission_adjustments", "CommissionAdjustment"),
    ("commission_records", "CommissionRecord"),
    ("contact_unlock_orders", "ContactUnlockOrder"),
    ("promoter_links", "PromoterLink"),
    ("promoters", "Promoter"),
    ("user_referrals", "UserReferral"),
    ("withdrawal_records", "WithdrawalRecord"),
]

for old, new in replacements:
    content = re.sub(rf"\b{re.escape(old)}\[\]", f"{new}[]", content)
    content = re.sub(rf"\b{re.escape(old)}\?", f"{new}?", content)
    content = re.sub(rf"\b{re.escape(old)}\b(?=\s+@relation|\s*$)", new, content)

with open("prisma/schema.prisma", "w") as f:
    f.write(content)

print("Done")
