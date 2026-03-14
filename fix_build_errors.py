import os
import re

def fix_fetch_calls(directory):
    for root, _, files in os.walk(directory):
        for file in files:
            if file.endswith(('.tsx', '.ts')):
                filepath = os.path.join(root, file)
                with open(filepath, 'r', encoding='utf-8') as f:
                    content = f.read()

                # 1. Fix double nested API URL variable
                # Replace `${process.env.NEXT_PUBLIC_API_URL || `${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'}`}`
                # with `${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'}`
                content = re.sub(
                    r'\$\{process\.env\.NEXT_PUBLIC_API_URL \|\| `\$\{process\.env\.NEXT_PUBLIC_API_URL \|\| \'http://127\.0\.0\.1:8000\'\}`\}',
                    r"${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'}",
                    content
                )

                # 2. Fix mismatched fetch backticks and single quotes
                # Pattern: fetch(`${...}'
                # Replace with: fetch(`${...}`
                content = re.sub(
                    r"fetch\(`(\$\{process\.env\.NEXT_PUBLIC_API_URL \|\| 'http://127\.0\.0\.1:8000'}[^`]*)'",
                    r"fetch(`\1`",
                    content
                )
                
                # 3. Handle cases where the whole fetch URL is messed up
                # Ensure fetch starts and ends with backticks if it contains interpolation
                def replace_fetch(match):
                    full_match = match.group(0)
                    url_part = match.group(1)
                    if '${' in url_part:
                        return f"fetch(`{url_part.strip('\"\'`')}`"
                    return full_match

                content = re.sub(r'fetch\((["\'`][^"\'`]*["\'`])', replace_fetch, content)

                # 4. Final safety check for the specific pattern that breaks most things:
                # fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'}/api/...', {
                # to 
                # fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'}/api/...`, {
                content = re.sub(
                    r'fetch\(`(\$\{process\.env\.NEXT_PUBLIC_API_URL \|\| \'http://127\.0\.0\.1:8000\'\}[^`]*)(\',|\', |\' {)',
                    lambda m: f"fetch(`{m.group(1)}`{m.group(2)[1:]}",
                    content
                )

                # 5. Correct potential double backticks
                content = content.replace("``", "`")

                with open(filepath, 'w', encoding='utf-8') as f:
                    f.write(content)

print("Starting fix process...")
fix_fetch_calls(r"c:\Users\owner\TELEGRAM SCRAPER ASSIGNMENT\frontend\src")
fix_fetch_calls(r"c:\Users\owner\TELEGRAM SCRAPER ASSIGNMENT\admin_panel\src")
print("Fix process completed.")
