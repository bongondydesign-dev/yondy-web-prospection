import re

with open("src/App.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# 1. Add activeTab state
state_match = re.search(r"const \[selectedProspectId, setSelectedProspectId\] = useState<string \| null>\(null\);", content)
if state_match and "activeTab" not in content:
    content = content[:state_match.start()] + "const [activeTab, setActiveTab] = useState<'prospection' | 'suivi' | 'dashboard'>('prospection');\n  " + content[state_match.start():]

# 2. Add pagination state
if "currentPage" not in content:
    content = content.replace("const [searchTerm, setSearchTerm] = useState('');", "const [searchTerm, setSearchTerm] = useState('');\n  const [currentPage, setCurrentPage] = useState(1);\n  const itemsPerPage = 10;")

# 3. Add pagination logic
if "const currentProspects" not in content:
    pag_logic = """
  // Pagination
  const totalPages = Math.ceil(filteredProspects.length / itemsPerPage);
  const currentProspects = filteredProspects.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
"""
    content = content.replace("// CSV Exporter", pag_logic + "\n  // CSV Exporter")

# 4. We will replace the entire return statement.
# To do this safely, we will extract the original parts and reassemble them.
header_match = re.search(r"{/\* HEADER SECTION.*?<header.*?</header>", content, re.DOTALL)
banner_match = re.search(r"{/\* MOTIVATIONAL BANNER.*?<div className=\"w-full max-w-7xl mx-auto px-4 lg:px-6 pt-5 flex flex-col gap-4\">.*?</div>\n\n      {/\* DETAILED CONTENT AREA \*/}", content, re.DOTALL)

# Extract components from inside the main area
nouveau_prospect = re.search(r"{/\* SECTION 1: FORMULAIRE NOUVEAU PROSPECT \*/}.*?(?={/\* SECTION 2 & 3: GENERATION PAR IA ET ENVOI WHATSAPP \*/})", content, re.DOTALL).group(0)
generation_message = re.search(r"{/\* SECTION 2 & 3: GENERATION PAR IA ET ENVOI WHATSAPP \*/}.*?(?={/\* RIGHT COLUMN: 7 Columns width)", content, re.DOTALL).group(0)

# Make generation message close the section correctly
generation_message = generation_message.rsplit("</section>", 1)[0]

chart_section = re.search(r"{/\* CHART: EVOLUTION DES PROSPECTS CONTACTES \*/}.*?(?={/\* FINANCIAL PERFORMANCE & PROFITABILITY DASHBOARD \*/})", content, re.DOTALL).group(0)
financial_section = re.search(r"{/\* FINANCIAL PERFORMANCE & PROFITABILITY DASHBOARD \*/}.*?(?={/\* SECTION 4: TABLEAU DE SUIVI DES PROSPECTS \*/})", content, re.DOTALL).group(0)
tableau_section = re.search(r"{/\* SECTION 4: TABLEAU DE SUIVI DES PROSPECTS \*/}.*?(?={/\* TWO DECORATIVE BENTO BOXES: WINNING MESSAGES LIBRARY & QUICK RELANCES TEMPLATES \*/})", content, re.DOTALL).group(0)
messages_gagnants = re.search(r"{/\* COMPONENT 5: LIBRARY OF \"MESSAGES GAGNANTS\" \*/}.*?(?={/\* QUICK RELANCES TEMPLATES \*/})", content, re.DOTALL).group(0)
quick_relances = re.search(r"{/\* QUICK RELANCES TEMPLATES \*/}.*?(?=\n          </div>\n\n        </section>\n\n      </main>)", content, re.DOTALL).group(0)

# Modal section
modal_section = re.search(r"{/\* --- DETAILED / VIEW MODAL POPUP --- \*/}.*", content, re.DOTALL).group(0)

# Replace mapping for pagination in the table:
tableau_section = tableau_section.replace("filteredProspects.map((p) => {", "currentProspects.map((p) => {")
tableau_section = tableau_section.replace("filteredProspects.length === 0", "currentProspects.length === 0")
tableau_section = tableau_section.replace("Affichage de {filteredProspects.length}", "Affichage de {currentProspects.length}")

# Add pagination controls to tableau_section
pagination_controls = """
            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="p-3 bg-white border-t border-gray-100 flex items-center justify-between">
                <button 
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 bg-gray-100 text-gray-700 text-xs font-bold rounded hover:bg-gray-200 disabled:opacity-50"
                >
                  Précédent
                </button>
                <span className="text-xs text-gray-500 font-bold">Page {currentPage} sur {totalPages}</span>
                <button 
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 bg-gray-100 text-gray-700 text-xs font-bold rounded hover:bg-gray-200 disabled:opacity-50"
                >
                  Suivant
                </button>
              </div>
            )}
"""
# insert pagination_controls before "{/* Total count footer */}"
tableau_section = tableau_section.replace("{/* Total count footer */}", pagination_controls + "\n            {/* Total count footer */}")

# Replace the Relance buttons to actually work
# In quick_relances, change the static text into functional buttons that set tempGeneratedMessage.
# Because regex is hard, let's just write the modified quick_relances
new_quick_relances = """
            {/* QUICK RELANCES TEMPLATES */}
            <div className="bg-white rounded-xl border border-gray-200/80 shadow-md p-4 flex flex-col">
              <div className="flex items-center justify-between border-b pb-2 mb-3">
                <h3 className="font-serif text-sm font-bold text-[#0B3D2E] flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4 text-[#0B3D2E]" />
                  Modèles de Relance Automatique
                </h3>
                <span className="text-[9px] uppercase font-bold text-[#E0633B]">Yondy Standard</span>
              </div>

              <div className="space-y-3 flex-1 flex flex-col justify-between">
                
                {/* Seed 2 relance scripts */}
                <div className="p-2.5 bg-sky-50/50 rounded-lg border border-sky-100 text-xs text-left">
                  <div className="flex justify-between items-center mb-1 bg-white/50 p-1 rounded">
                    <span className="font-bold text-sky-800 text-[11px]">Relance J+3 (Pas de réponse)</span>
                    <span className="text-[9px] bg-sky-100 text-sky-800 font-mono px-1 rounded font-bold">Urgence/Scarcity</span>
                  </div>
                  <p className="text-[11px] text-gray-600 italic leading-relaxed font-medium mb-2">
                    "Salut {activeSelectedProspect ? activeSelectedProspect.nom : '[Entreprise]'}! Toujours intéressé(e) par la stratégie web pour votre {activeSelectedProspect ? activeSelectedProspect.secteur : 'secteur'} dont on a parlé ? Je prends que 2 clients cette semaine."
                  </p>
                  <button 
                    disabled={!activeSelectedProspect}
                    onClick={() => setTempGeneratedMessage(`Salut ${activeSelectedProspect?.nom}! Toujours intéressé(e) par la stratégie web pour votre ${activeSelectedProspect?.secteur} dont on a parlé ? Je prends que 2 clients cette semaine.`)}
                    className="w-full text-[10px] bg-sky-100 hover:bg-sky-200 text-sky-800 font-bold py-1.5 rounded transition-colors disabled:opacity-50"
                  >
                    Injecter pour {activeSelectedProspect ? activeSelectedProspect.nom : "ce prospect"}
                  </button>
                </div>

                <div className="p-2.5 bg-emerald-50/50 rounded-lg border border-emerald-100 text-xs text-left">
                  <div className="flex justify-between items-center mb-1 bg-white/50 p-1 rounded">
                    <span className="font-bold text-emerald-800 text-[11px]">Relance J+7 (Proposition)</span>
                    <span className="text-[9px] bg-emerald-100 text-emerald-800 font-mono px-1 rounded font-bold">Valeur Ajoutée</span>
                  </div>
                  <p className="text-[11px] text-gray-600 italic leading-relaxed font-medium mb-2">
                    "Bonjour {activeSelectedProspect ? activeSelectedProspect.nom : '[Entreprise]'}, on a fait une pré-maquette gratuite pour vous montrer à quoi votre site ressemblerait. Vous avez 5 min pour qu'on vous la montre ?"
                  </p>
                  <button 
                    disabled={!activeSelectedProspect}
                    onClick={() => setTempGeneratedMessage(`Bonjour ${activeSelectedProspect?.nom}, on a fait une pré-maquette gratuite pour vous montrer à quoi votre site ressemblerait. Vous avez 5 min pour qu'on vous la montre ?`)}
                    className="w-full text-[10px] bg-emerald-100 hover:bg-emerald-200 text-emerald-800 font-bold py-1.5 rounded transition-colors disabled:opacity-50"
                  >
                    Injecter pour {activeSelectedProspect ? activeSelectedProspect.nom : "ce prospect"}
                  </button>
                </div>
              </div>
            </div>
"""

# Now assemble the new return statement
new_return = """
  return (
    <div id="yondy-container" className="min-h-screen bg-[#F7F4EE] font-sans text-[#1A1A18] flex flex-col antialiased">
      
      {/* HEADER SECTION WITH NAVIGATION */}
      <header className="bg-[#0B3D2E] text-white py-3 md:py-4 px-4 md:px-6 shadow-md z-30 sticky top-0">
        <div className="max-w-7xl mx-auto flex flex-col gap-4">
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#E0633B] text-white rounded-lg flex items-center justify-center shadow-md shrink-0">
                <span className="font-serif font-extrabold text-2xl tracking-tighter">Y</span>
              </div>
              <div>
                <h1 className="font-serif text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                  Yondy Web <span className="text-[10px] px-2 py-0.5 bg-white/10 rounded font-sans tracking-widest uppercase font-medium">Prospection</span>
                </h1>
                <p className="text-[10px] sm:text-xs text-white/70 uppercase tracking-widest font-mono">
                  Port-au-Prince / Pétion-Ville / Delmas · Haïti 🇭🇹
                </p>
              </div>
            </div>
          </div>

          {/* 3 TABS NAVIGATION */}
          <nav className="flex items-center bg-black/20 p-1 rounded-lg w-full overflow-x-auto no-scrollbar">
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
      </header>

      {/* DETAILED CONTENT AREA */}
      <main className="flex-1 w-full max-w-7xl mx-auto p-4 lg:p-6 items-start">
        
        {activeTab === 'prospection' && (
          <div className="flex flex-col gap-6 w-full max-w-3xl mx-auto">
            {/* MOTIVATIONAL BANNER (Compacted for Prospection only) */}
            <div className="bg-white rounded-xl border border-gray-200/80 shadow-xs p-3.5 flex items-center gap-3">
              <span className="text-lg">🎯</span>
              <div className="flex-1">
                <div className="flex justify-between items-center text-xs font-semibold text-gray-800 mb-1">
                  <span>Objectif d'envoi du jour</span>
                  <span className="font-bold text-[#E0633B]">{stats.sentToday}/20</span>
                </div>
                <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                  <div 
                    className="bg-emerald-600 h-full transition-all duration-300"
                    style={{ width: `${Math.min((stats.sentToday / 20) * 100, 100)}%` }}
                  ></div>
                </div>
              </div>
            </div>

            __NOUVEAU_PROSPECT__
            __GENERATION_MESSAGE__
            __MESSAGES_GAGNANTS__
            __QUICK_RELANCES__
          </div>
        )}

        {activeTab === 'suivi' && (
          <div className="flex flex-col gap-6 w-full">
            __TABLEAU_SECTION__
          </div>
        )}

        {activeTab === 'dashboard' && (
          <div className="flex flex-col gap-6 w-full">
            {/* MOTIVATIONAL BANNER - Dashboard view */}
            {!stats.isSignificant && (
              <div className="bg-amber-50 border-l-4 border-amber-500 rounded-r-xl p-3.5 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-left">
                <div className="flex items-start gap-3">
                  <span className="text-xl shrink-0">📊</span>
                  <div>
                    <h4 className="font-bold text-xs text-amber-900 flex items-center gap-1.5">
                      Échantillon de suivi réduit ({stats.contactedCount} / 21 prospects contactés)
                    </h4>
                    <p className="text-[11px] text-amber-800 mt-0.5 leading-relaxed font-medium">
                      Le <strong>Taux de réponse</strong> officiel n'est pas affiché car le volume de test est trop faible.
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            {/* Core Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white border rounded-xl p-4 shadow-sm">
                <p className="text-[10px] uppercase text-gray-500 font-bold tracking-wider">Total Prospects</p>
                <p className="text-2xl font-bold font-serif text-[#E0633B]">{stats.total}</p>
              </div>
              <div className="bg-white border rounded-xl p-4 shadow-sm">
                <p className="text-[10px] uppercase text-gray-500 font-bold tracking-wider">Taux de réponse</p>
                <p className="text-2xl font-bold font-serif text-emerald-600">{stats.isSignificant ? `${stats.responseRate}%` : 'N/A'}</p>
              </div>
              <div className="bg-white border rounded-xl p-4 shadow-sm">
                <p className="text-[10px] uppercase text-gray-500 font-bold tracking-wider">Convertis</p>
                <p className="text-2xl font-bold font-serif text-emerald-600">{stats.conversionCount}</p>
              </div>
              <div className="bg-white border rounded-xl p-4 shadow-sm">
                <p className="text-[10px] uppercase text-gray-500 font-bold tracking-wider">Revenu Total</p>
                <p className="text-2xl font-bold font-serif text-amber-500">${stats.totalRevenue}</p>
              </div>
            </div>

            __CHART_SECTION__
            __FINANCIAL_SECTION__
          </div>
        )}

      </main>

      {/* FOOTER */}
      <footer className="bg-[#0B3D2E] text-white py-6 text-center mt-auto border-t-4 border-[#E0633B]">
        <div className="flex items-center justify-center gap-2 mb-2">
          <div className="w-6 h-6 bg-[#E0633B] text-white rounded flex items-center justify-center">
            <span className="font-serif font-bold text-xs">Y</span>
          </div>
          <span className="font-serif font-bold tracking-tight">Yondy Web</span>
        </div>
        <p className="text-white/60 text-xs font-mono">
          Outil interne de prospection et CRM · v1.2
        </p>
        <p className="text-white/40 text-[9px] mt-2 max-w-md mx-auto leading-relaxed px-4">
          Cette application centralise les données des commerçants haïtiens prospectés. L'intégration IA permet la personnalisation contextuelle locale.
        </p>
      </footer>

      {/* MODAL SECTION */}
      __MODAL_SECTION__
    </div>
  );
}
"""

new_return = new_return.replace("__NOUVEAU_PROSPECT__", nouveau_prospect)
new_return = new_return.replace("__GENERATION_MESSAGE__", generation_message)
new_return = new_return.replace("__MESSAGES_GAGNANTS__", messages_gagnants)
new_return = new_return.replace("__QUICK_RELANCES__", new_quick_relances)
new_return = new_return.replace("__TABLEAU_SECTION__", tableau_section)
new_return = new_return.replace("__CHART_SECTION__", chart_section)
new_return = new_return.replace("__FINANCIAL_SECTION__", financial_section)
new_return = new_return.replace("__MODAL_SECTION__", modal_section)

# Replace the entire return statement
return_index = content.find("  return (")
if return_index != -1:
    new_content = content[:return_index] + new_return
else:
    new_content = content

with open("src/App.tsx", "w", encoding="utf-8") as f:
    f.write(new_content)
print("done")
