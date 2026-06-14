import json

with open("src/components/header.tsx") as f:
    content = f.read()

# Add circles after blog in navItems
old = '{ label: t("nav.blog"), href: `/${locale}/blog`, icon: BookOpen },'
new = old + '\n    { label: isEn ? "Circles" : "圈子", href: `/${locale}/circles`, icon: MessageCircle },'
content = content.replace(old, new)

# Add MessageCircle import
old_import = 'import { Briefcase, BookOpen, TrendingUp, Globe, User, ChevronDown, Menu, X, LogOut } from "lucide-react";'
new_import = 'import { Briefcase, BookOpen, TrendingUp, Globe, User, ChevronDown, Menu, X, LogOut, MessageCircle } from "lucide-react";'
content = content.replace(old_import, new_import)

with open("src/components/header.tsx", "w") as f:
    f.write(content)
print("done")
