import os

def fix_app():
    with open('src/App.tsx', 'r', encoding='utf-8') as f:
        content = f.read()

    # Fix 1: opening fragment
    content = content.replace(
        "{activeTab === 'prospection' && (\n        {/* MOTIVATIONAL BANNER BASED ON DAILY OBJECTIVES & STATISTICAL SIGNIFICANCE WARNING */}",
        "{activeTab === 'prospection' && (<>\n        {/* MOTIVATIONAL BANNER BASED ON DAILY OBJECTIVES & STATISTICAL SIGNIFICANCE WARNING */}"
    )

    # Fix 2: closing fragment before main
    content = content.replace(
        '      )}\n\n      {/* DETAILED CONTENT AREA */}',
        '      </>)}\n\n      {/* DETAILED CONTENT AREA */}'
    )
    # the script above generated '        )}\n\n        {/* DETAILED CONTENT AREA */}', let's check exact indentation:
    content = content.replace(
        '        )}\n\n        {/* DETAILED CONTENT AREA */}',
        '        </>)}\n\n        {/* DETAILED CONTENT AREA */}'
    )

    with open('src/App.tsx', 'w', encoding='utf-8') as f:
        f.write(content)

if __name__ == '__main__':
    fix_app()
