#!/usr/bin/env python3
"""修复 schema.prisma，移除 MySQL 特定类型约束"""

import re

schema_file = 'prisma/schema.prisma'

print("🔧 修复 Prisma Schema for SQLite")
print("")

# 读取文件
with open(schema_file, 'r', encoding='utf-8') as f:
    content = f.read()

# 移除所有 @db.* 类型约束
patterns = [
    (r'\s*@db\.VarChar\([^)]*\)', ''),
    (r'\s*@db\.Text\b', ''),
    (r'\s*@db\.TinyInt\b', ''),
    (r'\s*@db\.Int\b', ''),
    (r'\s*@db\.BigInt\b', ''),
]

for pattern, replacement in patterns:
    before_count = len(re.findall(pattern, content))
    content = re.sub(pattern, replacement, content)
    if before_count > 0:
        print(f"✅ 移除 {before_count} 个 {pattern.replace(r'\s*', '').replace(r'\b', '')} 约束")

# 写回文件
with open(schema_file, 'w', encoding='utf-8') as f:
    f.write(content)

print("")
print("🎉 Schema 修复完成！")
print("")
print("现在可以运行：")
print("  npm run prisma:generate")
print("  npm run prisma:push")
