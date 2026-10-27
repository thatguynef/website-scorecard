"""
Convert GitHub-style Markdown alerts into Material admonitions.

Source files keep `> [!NOTE]` so GitHub renders them natively. MkDocs runs this
hook before Markdown conversion so the docs site gets proper admonitions.
"""

import re

ALERT_RE = re.compile(r"^(\s*)>\s*\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]\s*$", re.IGNORECASE)
QUOTE_RE = re.compile(r"^\s*>\s?(.*)$")
KINDS = {
    "note": "note",
    "tip": "tip",
    "important": "warning",
    "warning": "warning",
    "caution": "danger",
}


def on_page_markdown(markdown, **kwargs):
    lines = markdown.splitlines()
    out = []
    index = 0

    while index < len(lines):
        match = ALERT_RE.match(lines[index])
        if not match:
            out.append(lines[index])
            index += 1
            continue

        indent, kind = match.group(1), match.group(2).lower()
        index += 1
        body = []

        while index < len(lines):
            line = lines[index]
            if not line.strip():
                if index + 1 < len(lines) and QUOTE_RE.match(lines[index + 1]):
                    body.append("")
                    index += 1
                    continue
                break
            quote = QUOTE_RE.match(line)
            if not quote:
                break
            body.append(quote.group(1))
            index += 1

        while body and not body[-1]:
            body.pop()

        if out and out[-1].strip():
            out.append("")
        out.append(f"{indent}!!! {KINDS[kind]}")
        out.append("")
        for line in body:
            out.append(f"{indent}    {line}" if line else "")
        out.append("")

    return "\n".join(out).rstrip() + "\n"
