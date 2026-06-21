import json
import re

log_file = r"C:\Users\bayon\.gemini\antigravity-ide\brain\67c04590-698c-45cd-a625-bc876be35b56\.system_generated\logs\transcript.jsonl"

with open(log_file, 'r', encoding='utf-8') as f:
    lines = list(f)

for line in lines:
    try:
        data = json.loads(line)
        if data.get('type') == 'TOOL_RESPONSE':
            for tr in data.get('tool_responses', []):
                out = tr.get('output', '')
                if 'File Path: `file:///c:/Users/bayon/Downloads/yondy-web-prospection/src/App.tsx`' in out:
                    # check if it has the "Showing lines" part
                    if 'Showing lines' in out:
                        # Extract the lines
                        lines_extracted = []
                        for out_line in out.split('\n'):
                            match = re.match(r'^(\d+):\s(.*)$', out_line)
                            if match:
                                line_num = int(match.group(1))
                                line_content = match.group(2)
                                lines_extracted.append((line_num, line_content))
                        
                        if len(lines_extracted) > 0:
                            print(f"Found {len(lines_extracted)} lines")
                            with open(f"recovered_{lines_extracted[0][0]}.txt", "w", encoding="utf-8") as outf:
                                for _, content in lines_extracted:
                                    outf.write(content + "\n")
    except Exception as e:
        pass

print("Done extracting")
