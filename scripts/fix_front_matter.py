#!/usr/bin/env python3
import os
import re
from pathlib import Path


def extract_date_from_path(file_path):
    """从文件路径中提取日期，如 content/posts/2025/02/25/file.md -> 2025-02-25"""
    parts = Path(file_path).parts
    # 查找类似 2025, 02, 25 的连续三个数字段
    for i, part in enumerate(parts):
        if re.match(r"^\d{4}$", part):
            year = part
            if i + 2 < len(parts):
                month = parts[i + 1]
                day = parts[i + 2]
                if re.match(r"^\d{2}$", month) and re.match(r"^\d{2}$", day):
                    return f"{year}-{month}-{day}"
    return None


def extract_title_from_content(content):
    """从文章内容中提取第一个 H1 标题"""
    match = re.search(r"^#\s+(.+)$", content, re.MULTILINE)
    if match:
        return match.group(1).strip()
    return None


def has_front_matter(content):
    """检查是否有 front matter"""
    return (
        content.startswith("---")
        or content.startswith("+++")
        or content.startswith("{")
    )


def process_file(file_path):
    """处理单个文件"""
    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()

    if has_front_matter(content):
        print(f"SKIP (has front matter): {file_path}")
        return False

    date = extract_date_from_path(file_path)
    title = extract_title_from_content(content)

    if not date:
        print(f"WARN (no date found): {file_path}")
        return False

    # 生成 front matter
    front_matter = f"""---
date: "{date}T00:00:00+08:00"
title: "{title or "Untitled"}"
---
"""

    # 组合新的内容
    new_content = front_matter + content

    with open(file_path, "w", encoding="utf-8") as f:
        f.write(new_content)

    print(f"ADDED front matter - date: {date}, title: {title} -> {file_path}")
    return True


def main():
    base_dir = Path("/Users/yuryqwer/Desktop/project/myblog/content/posts")

    count = 0
    for md_file in base_dir.rglob("*.md"):
        # 跳过 _index.md 文件
        if "_index" in md_file.name:
            continue
        if process_file(md_file):
            count += 1

    print(f"\n处理完成，共修改 {count} 个文件")


if __name__ == "__main__":
    main()
