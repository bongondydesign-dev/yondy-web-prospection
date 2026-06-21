import re

with open('src/App.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add import
if "import { extractDataFromText, generateMessage } from './gemini';" not in content:
    content = content.replace("import { db } from './firebase';", "import { extractDataFromText, generateMessage } from './gemini';\nimport { db } from './firebase';")

# 2. Replace extract
old_extract = """      const response = await fetch('/api/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rawText: rawPasteText })
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || "Une erreur s'est produite lors de l'extraction par l'IA.");
      }

      const data = await response.json();"""

new_extract = """      const data = await extractDataFromText(rawPasteText);"""

if old_extract in content:
    content = content.replace(old_extract, new_extract)

# 3. Replace generate
old_generate = """        const response = await fetch('/api/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prospect: activeSelectedProspect,
            lang: chosenLanguage,
            professionalYetLocal
          })
        });

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData.error || "Erreur de serveur de gÃ©nÃ©ration.");
        }

        const data = await response.json();
        setTempGeneratedMessage(data.message);
        
        // update the message in state instantly
        setProspects(prev => prev.map(p => {
          if (p.id === activeSelectedProspect.id) {
            return { ...p, messageEnvoye: data.message };
          }
          return p;
        }));"""

# we need to fix the encoding issue for old_generate replace if it doesn't match directly
# let's use a regex
content = re.sub(r"const response = await fetch\('/api/generate'.*?const data = await response\.json\(\);\s*setTempGeneratedMessage\(data\.message\);\s*// update the message in state instantly\s*setProspects\(prev => prev\.map\(p => \{\s*if \(p\.id === activeSelectedProspect\.id\) \{\s*return \{ \.\.\.p, messageEnvoye: data\.message \};\s*\}\s*return p;\s*\}\)\);", 
"""const text = await generateMessage(
          activeSelectedProspect,
          chosenLanguage,
          professionalYetLocal
        );

        setTempGeneratedMessage(text);
        
        // update the message in state instantly
        setProspects(prev => prev.map(p => {
          if (p.id === activeSelectedProspect.id) {
            return { ...p, messageEnvoye: text };
          }
          return p;
        }));""", content, flags=re.DOTALL)

with open('src/App.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("Done.")
