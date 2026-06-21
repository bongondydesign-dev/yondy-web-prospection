import os

def fix_app():
    with open('src/App.tsx', 'r', encoding='utf-8') as f:
        content = f.read()

    # Fix double section closing tag
    content = content.replace(
        '        </section>\n\n          </section>\n        )}',
        '        </section>\n        )}'
    )

    with open('src/App.tsx', 'w', encoding='utf-8') as f:
        f.write(content)

if __name__ == '__main__':
    fix_app()
