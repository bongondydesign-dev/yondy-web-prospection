import json

log_file = r"C:\Users\bayon\.gemini\antigravity-ide\brain\67c04590-698c-45cd-a625-bc876be35b56\.system_generated\logs\transcript.jsonl"

with open(log_file, 'r', encoding='utf-8') as f:
    lines = list(f)

for line in reversed(lines):
    try:
        data = json.loads(line)
        if data.get('type') == 'PLANNER_RESPONSE':
            for tc in data.get('tool_calls', []):
                if tc.get('name') == 'default_api:write_to_file':
                    args = tc.get('arguments', {})
                    if 'App.tsx' in args.get('TargetFile', ''):
                        print("Found write_to_file!")
                        with open("recovered_App.tsx", "w", encoding="utf-8") as out:
                            out.write(args.get('CodeContent', ''))
                        exit(0)
    except Exception as e:
        pass

print("Not found")
