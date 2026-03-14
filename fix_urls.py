import os

def replace_in_dir(directory):
    for root, _, files in os.walk(directory):
        for file in files:
            if file.endswith(('.tsx', '.ts')):
                filepath = os.path.join(root, file)
                with open(filepath, 'r', encoding='utf-8') as f:
                    content = f.read()

                # Fix hardcoded localhost
                if "http://127.0.0.1:8000" in content:
                    # Next.js fetch calls in client components might just use string literals
                    # Let's replace 'http://127.0.0.1:8000' with:
                    # `${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'}`
                    
                    # Also need to handle cases where it's a string literal like 'http://127.0.0.1:8000/api/...'
                    content = content.replace("'http://127.0.0.1:8000", "`${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'}")
                    content = content.replace("\"http://127.0.0.1:8000", "`${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'}")
                    
                    # Notice we replaced the start quote. Now we need to append the closing backtick.
                    # This might break if the original string was concatenated or using backticks already.
                    # A safer approach is just to replace the exact substring in the URL:
                    # Let's write a safer replace logic for string interpolation format
                    pass

                # Safer regex replacement
                import re
                
                # Turn 'http://127.0.0.1:8000/something' 
                # into `${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'}/something`
                
                # Single quotes
                content = re.sub(
                    r"'http://127\.0\.0\.1:8000([^']*)'",
                    r"`${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'}\1`",
                    content
                )
                
                # Double quotes
                content = re.sub(
                    r'"http://127\.0\.0\.1:8000([^"]*)"',
                    r"`${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'}\1`",
                    content
                )
                
                # Backticks
                content = re.sub(
                    r"`http://127\.0\.0\.1:8000([^`]*)`",
                    r"`${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'}\1`",
                    content
                )

                with open(filepath, 'w', encoding='utf-8') as f:
                    f.write(content)

replace_in_dir(r"c:\Users\owner\TELEGRAM SCRAPER ASSIGNMENT\frontend")
replace_in_dir(r"c:\Users\owner\TELEGRAM SCRAPER ASSIGNMENT\admin_panel")
