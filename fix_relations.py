import re

with open("prisma/schema.prisma", "r") as f:
    content = f.read()

renames = [
    # ContactUnlockOrder
    (r"(model ContactUnlockOrder \{.*?)^  commission_records", r"\1  commission"),
    (r"(model ContactUnlockOrder \{.*?)^  jobs               Job", r"\1  job                Job"),
    (r"(model ContactUnlockOrder \{.*?)^  users              User", r"\1  user               User"),

    # PromoterLink
    (r"(model PromoterLink \{.*?)^  commission_records CommissionRecord\[\]", r"\1  commissions        CommissionRecord[]"),
    (r"(model PromoterLink \{.*?)^  promoters          Promoter", r"\1  promoter           Promoter"),
    (r"(model PromoterLink \{.*?)^  user_referrals     UserReferral\[\]", r"\1  referrals          UserReferral[]"),

    # Promoter
    (r"(model Promoter \{.*?)^  commission_adjustments CommissionAdjustment\[\]", r"\1  adjustments          CommissionAdjustment[]"),
    (r"(model Promoter \{.*?)^  commission_records     CommissionRecord\[\]", r"\1  commissions            CommissionRecord[]"),
    (r"(model Promoter \{.*?)^  promoter_links         PromoterLink\[\]", r"\1  links                  PromoterLink[]"),
    (r"(model Promoter \{.*?)^  users                  User\?", r"\1  user                   User?"),
    (r"(model Promoter \{.*?)^  user_referrals         UserReferral\[\]", r"\1  referrals              UserReferral[]"),
    (r"(model Promoter \{.*?)^  withdrawal_records     WithdrawalRecord\[\]", r"\1  withdrawals            WithdrawalRecord[]"),

    # UserReferral
    (r"(model UserReferral \{.*?)^  promoter_links PromoterLink", r"\1  link           PromoterLink"),
    (r"(model UserReferral \{.*?)^  promoters      Promoter", r"\1  promoter       Promoter"),
    (r"(model UserReferral \{.*?)^  users          User", r"\1  user           User"),

    # WithdrawalRecord
    (r"(model WithdrawalRecord \{.*?)^  promoters     Promoter", r"\1  promoter      Promoter"),

    # CommissionAdjustment
    (r"(model CommissionAdjustment \{.*?)^  commission_records CommissionRecord", r"\1  commission         CommissionRecord"),
    (r"(model CommissionAdjustment \{.*?)^  promoters          Promoter", r"\1  promoter           Promoter"),

    # CommissionRecord
    (r"(model CommissionRecord \{.*?)^  commission_adjustments CommissionAdjustment\[\]", r"\1  adjustments            CommissionAdjustment[]"),
    (r"(model CommissionRecord \{.*?)^  promoter_links         PromoterLink", r"\1  link                   PromoterLink"),
    (r"(model CommissionRecord \{.*?)^  contact_unlock_orders  ContactUnlockOrder", r"\1  order                  ContactUnlockOrder"),
    (r"(model CommissionRecord \{.*?)^  promoters              Promoter", r"\1  promoter               Promoter"),
]

for pattern, repl in renames:
    content = re.sub(pattern, repl, content, flags=re.DOTALL | re.MULTILINE)

# Also rename plural relation fields in User model pointing to CPS models (if any)
# User already has snake_case field names as relations. We added balance_transactions.
# We don't strictly need to rename them for compilation, but it's nice.

with open("prisma/schema.prisma", "w") as f:
    f.write(content)

print("Done")
