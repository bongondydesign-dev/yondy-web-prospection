import json
import re

log_file = r"C:\Users\bayon\.gemini\antigravity-ide\brain\67c04590-698c-45cd-a625-bc876be35b56\.system_generated\logs\transcript.jsonl"
longest_str = ""

with open(log_file, 'r', encoding='utf-8') as f:
    content = f.read()
    
# Let's find anything that looks like a large chunk of React code.
# We will search for "export default function App"
matches = re.finditer(r'export default function App\(\) \{.*', content)
for m in matches:
    # Because JSON escapes strings, we might need to load JSON first.
    pass

with open(log_file, 'r', encoding='utf-8') as f:
    for line in f:
        try:
            data = json.loads(line)
            # Recursively search for large strings
            def search_str(obj):
                global longest_str
                if isinstance(obj, str):
                    if "export default function App" in obj and len(obj) > len(longest_str):
                        longest_str = obj
                elif isinstance(obj, dict):
                    for v in obj.values():
                        search_str(v)
                elif isinstance(obj, list):
                    for v in obj:
                        search_str(v)
            search_str(data)
        except Exception as e:
            pass

print(f"Longest App.tsx string found has length: {len(longest_str)}")
if len(longest_str) > 100000:
    with open("recovered_App.tsx", "w", encoding="utf-8") as out:
        out.write(longest_str)
