import os
import re

def fix_content(content):
    # 1. Fix the broken environment variable fallback with mismatched backtick/quote
    content = content.replace("`http://127.0.0.1:8000'}", "'http://127.0.0.1:8000'}")
    
    # 2. Fix fetch URLs that start with backtick but end with single quote
    # Example: fetch(`${...}/api/groups', {
    content = re.sub(
        r'fetch\(`(\$\{process\.env\.NEXT_PUBLIC_API_URL[^`]+)\', \{',
        r'fetch(`\1`, {',
        content
    )
    
    # 3. Fix Authorization header with a backtick before the colon
    # Example: 'Authorization`: `Bearer
    content = content.replace("'Authorization`: `Bearer", "'Authorization': `Bearer")
    
    # 4. Fix any nested process.env.NEXT_PUBLIC_API_URL madness
    # Pattern: ${process.env.NEXT_PUBLIC_API_URL || `${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'}`}
    content = re.sub(
        r'\$\{process\.env\.NEXT_PUBLIC_API_URL \|\| `\$\{process\.env\.NEXT_PUBLIC_API_URL \|\| \'http://127\.0\.0\.1:8000\'\}`\}',
        r"${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'}",
        content
    )

    # 5. Fix spaces around dots in localStorage (seen in some logs)
    content = content.replace("localStorage . getItem", "localStorage.getItem")

    return content

def process_dir(directory):
    for root, _, files in os.walk(directory):
        for file in files:
            if file.endswith(('.tsx', '.ts')):
                filepath = os.path.join(root, file)
                with open(filepath, 'r', encoding='utf-8') as f:
                    content = f.read()
                
                new_content = fix_content(content)
                
                if new_content != content:
                    with open(filepath, 'w', encoding='utf-8') as f:
                        f.write(new_content)
                    print(f"Fixed: {filepath}")

if __name__ == "__main__":
    process_dir(r"c:\Users\owner\TELEGRAM SCRAPER ASSIGNMENT\frontend\src")
    process_dir(r"c:\Users\owner\TELEGRAM SCRAPER ASSIGNMENT\admin_panel\src")
