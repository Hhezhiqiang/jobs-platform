for fpath in ["src/components/header.tsx", "src/components/mobile-bottom-nav.tsx"]:
    with open(fpath) as f:
        content = f.read()
    if "MessageCircle" not in content:
        content = content.replace(
            'TrendingUp } from "lucide-react"',
            'TrendingUp, MessageCircle } from "lucide-react"'
        )
    marker = 'icon: TrendingUp },'
    new_line = '''icon: TrendingUp },
    { label: "圈子", href: `/${locale}/circles`, icon: MessageCircle },'''
    if "\u5708\u5b50" not in content:
        content = content.replace(marker, new_line)
    with open(fpath, "w") as f:
        f.write(content)
    print(fpath + " done")
