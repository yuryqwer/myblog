#!/usr/bin/env python3
import re
from pathlib import Path


def remove_first_h1(content):
    """移除文章内容中的第一个 H1 标题"""
    lines = content.split("\n")

    # 找到第一个以 # 开头的行
    for i, line in enumerate(lines):
        if re.match(r"^#\s+", line):
            # 移除这一行
            lines.pop(i)
            # 同时移除紧跟的空行（如果有）
            if i < len(lines) and lines[i].strip() == "":
                lines.pop(i)
            break

    return "\n".join(lines)


def process_file(file_path):
    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()

    new_content = remove_first_h1(content)

    if new_content != content:
        with open(file_path, "w", encoding="utf-8") as f:
            f.write(new_content)
        print(f"REMOVED H1: {file_path}")
        return True
    return False


def main():
    base_dir = Path("/Users/yuryqwer/Desktop/project/myblog/content/posts")

    count = 0
    for md_file in base_dir.rglob("*.md"):
        if "_index" in md_file.name:
            continue
        if process_file(md_file):
            count += 1

    print(f"\n处理完成，共修改 {count} 个文件")


if __name__ == "__main__":
    main()
