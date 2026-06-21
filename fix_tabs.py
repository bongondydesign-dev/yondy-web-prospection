def fix_app():
    with open('src/App.tsx', 'r', encoding='utf-8') as f:
        content = f.read()

    content = content.replace(
        "{activeTab === 'prospection' && (\n          {/* MOTIVATIONAL BANNER BASED ON DAILY OBJECTIVES & STATISTICAL SIGNIFICANCE WARNING */}",
        "{activeTab === 'prospection' && (<>\n          {/* MOTIVATIONAL BANNER BASED ON DAILY OBJECTIVES & STATISTICAL SIGNIFICANCE WARNING */}"
    )

    content = content.replace(
        '        )}\n\n        {/* DETAILED CONTENT AREA */}',
        '        </>)}\n\n        {/* DETAILED CONTENT AREA */}'
    )

    with open('src/App.tsx', 'w', encoding='utf-8') as f:
        f.write(content)

if __name__ == '__main__':
    fix_app()
