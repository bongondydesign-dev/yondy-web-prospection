import re
import sys

def modify_app():
    with open('src/App.tsx', 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. Add state
    state_anchor = "  // --- STATE MANAGEMENT ---"
    if "const [activeTab" not in content:
        content = content.replace(
            state_anchor,
            "  // --- STATE MANAGEMENT ---\n  const [activeTab, setActiveTab] = useState<'prospection' | 'suivi' | 'dashboard'>('prospection');"
        )

    # 2. Add tabs in header
    header_end = "          </div>\n        </header>"
    tabs_html = """
            {/* 3 TABS NAVIGATION */}
            <nav className="flex items-center bg-black/20 p-1 rounded-lg w-full mt-4 overflow-x-auto no-scrollbar">
              <button 
                onClick={() => setActiveTab('prospection')}
                className={`flex-1 px-4 py-2 text-xs sm:text-sm font-bold rounded-md transition-all whitespace-nowrap ${activeTab === 'prospection' ? 'bg-[#E0633B] text-white shadow-md' : 'text-white/70 hover:text-white hover:bg-white/10'}`}
              >
                🚀 Prospection
              </button>
              <button 
                onClick={() => setActiveTab('suivi')}
                className={`flex-1 px-4 py-2 text-xs sm:text-sm font-bold rounded-md transition-all whitespace-nowrap ${activeTab === 'suivi' ? 'bg-[#E0633B] text-white shadow-md' : 'text-white/70 hover:text-white hover:bg-white/10'}`}
              >
                📋 Suivi
              </button>
              <button 
                onClick={() => setActiveTab('dashboard')}
                className={`flex-1 px-4 py-2 text-xs sm:text-sm font-bold rounded-md transition-all whitespace-nowrap ${activeTab === 'dashboard' ? 'bg-[#E0633B] text-white shadow-md' : 'text-white/70 hover:text-white hover:bg-white/10'}`}
              >
                📊 Tableau de bord
              </button>
            </nav>
          </div>
        </header>"""
    if "3 TABS NAVIGATION" not in content:
        content = content.replace(header_end, tabs_html)

    # 3. Main structure replacement
    # We will replace the <main ... grid> and everything inside by just doing string manipulations.
    
    # We need to wrap the banner
    content = content.replace(
        '{/* MOTIVATIONAL BANNER BASED ON DAILY OBJECTIVES & STATISTICAL SIGNIFICANCE WARNING */}',
        "{activeTab === 'prospection' && (\n        {/* MOTIVATIONAL BANNER BASED ON DAILY OBJECTIVES & STATISTICAL SIGNIFICANCE WARNING */}"
    )
    # The banner ends right before {/* DETAILED CONTENT AREA */}
    content = content.replace(
        '        {/* DETAILED CONTENT AREA */}',
        '        )}\n\n        {/* DETAILED CONTENT AREA */}'
    )

    # Make main full width and not grid
    content = content.replace(
        '<main className="flex-1 w-full max-w-7xl mx-auto p-4 lg:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">',
        '<main className="flex-1 w-full max-w-7xl mx-auto p-4 lg:p-6 items-start flex flex-col gap-6">'
    )

    # Left column -> Prospection tab
    content = content.replace(
        '<section className="lg:col-span-5 flex flex-col gap-6 w-full">',
        "{activeTab === 'prospection' && (\n          <section className=\"flex flex-col gap-6 w-full max-w-3xl mx-auto\">"
    )

    # The left column ends at {/* RIGHT COLUMN: 7 Columns width... */}
    content = content.replace(
        '        {/* RIGHT COLUMN: 7 Columns width - TRACKING TABLE, STATISTICS, WINNING TEMPLATES LIBRARY */}',
        '          </section>\n        )}\n\n        {/* RIGHT COLUMN: 7 Columns width - TRACKING TABLE, STATISTICS, WINNING TEMPLATES LIBRARY */}'
    )

    # Right column wrap
    content = content.replace(
        '<section className="lg:col-span-7 flex flex-col gap-6 w-full">',
        '<section className="flex flex-col gap-6 w-full">'
    )

    # In the right column, we have:
    # 1. CHART
    # 2. KEY METRICS
    # 3. REVENUE BREAKDOWN
    # 4. SECTION 4: TABLEAU DE SUIVI
    # 5. BENTO BOXES (WINNING MESSAGES)

    # Wrap DASHBOARD components
    content = content.replace(
        '{/* CHART: EVOLUTION DES PROSPECTS CONTACTES */}',
        "{activeTab === 'dashboard' && (<>\n          {/* CHART: EVOLUTION DES PROSPECTS CONTACTES */}"
    )

    # Ends before SECTION 4
    content = content.replace(
        '          {/* SECTION 4: TABLEAU DE SUIVI DES PROSPECTS */}',
        "          </>)}\n\n          {activeTab === 'suivi' && (<>\n          {/* SECTION 4: TABLEAU DE SUIVI DES PROSPECTS */}"
    )

    # Ends before Modal
    content = content.replace(
        '        {/* --- MODAL DE DÃ‰TAILS DU PROSPECT --- */}',
        "          </>)}\n        </section>\n\n        {/* --- MODAL DE DÃ‰TAILS DU PROSPECT --- */}"
    )

    # Fix modal encoding glitch if any from earlier (Ã© -> é etc, actually let's just use what's there)

    with open('src/App.tsx', 'w', encoding='utf-8') as f:
        f.write(content)

if __name__ == '__main__':
    modify_app()
