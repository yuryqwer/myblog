#!/usr/bin/env python3
"""
Convert HTML image tags and figure tags to Hugo Shortcodes.

Patterns converted:
1. <img class="narrow-image" ...> → {{< img class="narrow" >}}
2. <img class="wide-image" ...> → {{< img class="wide" >}}
3. <figure><img>...<figcaption>...</figcaption></figure> → {{< figure caption="..." >}}
"""

import re
from pathlib import Path


def convert_class_name(class_value):
    """Convert narrow-image to narrow, wide-image to wide"""
    class_map = {"narrow-image": "narrow", "wide-image": "wide"}
    return class_map.get(class_value, class_value)


def convert_img_tag(match):
    """Convert <img> tag to img shortcode"""
    src = match.group(1)
    class_value = match.group(2) if match.group(2) else ""
    alt = match.group(3) if match.group(3) else ""

    class_name = convert_class_name(class_value)

    # Hugo shortcode syntax: {{< img ... >}}
    return '{{< img src="' + src + '" alt="' + alt + '" class="' + class_name + '" >}}'


def convert_figure_tag(content):
    """Convert <figure>...</figure> to figure shortcode"""
    # Pattern for figure with img and figcaption
    pattern = r'<figure>\s*<img\s+src="([^"]+)"\s+class="([^"]+)"\s+alt="([^"]*)">(?:[^<]*)<figcaption>([^<]*)</figcaption>\s*</figure>'

    def replacer(match):
        src = match.group(1)
        class_value = match.group(2)
        alt = match.group(3)
        caption = match.group(4)
        class_name = convert_class_name(class_value)

        return (
            '{{< figure src="'
            + src
            + '" alt="'
            + alt
            + '" caption="'
            + caption
            + '" class="'
            + class_name
            + '" >}}'
        )

    return re.sub(pattern, replacer, content, flags=re.DOTALL)


def convert_simple_img_tags(content):
    """Convert standalone img tags to img shortcode"""
    # Pattern: <img src="..." class="narrow-image" alt="...">
    pattern = (
        r'<img\s+src="([^"]+)"\s+class="(narrow-image|wide-image)"\s+alt="([^"]*)">'
    )
    return re.sub(pattern, convert_img_tag, content)


def convert_posts():
    """Convert all post files"""
    base_dir = Path("/Users/yuryqwer/Desktop/project/myblog/content/posts")

    count = 0
    for md_file in base_dir.rglob("*.md"):
        if "_index" in md_file.name:
            continue

        with open(md_file, "r", encoding="utf-8") as f:
            content = f.read()

        original = content

        # First convert figure tags
        content = convert_figure_tag(content)
        # Then convert simple img tags
        content = convert_simple_img_tags(content)

        if content != original:
            with open(md_file, "w", encoding="utf-8") as f:
                f.write(content)
            print(f"CONVERTED: {md_file}")
            count += 1

    print(f"\n处理完成，共修改 {count} 个文件")


if __name__ == "__main__":
    convert_posts()
