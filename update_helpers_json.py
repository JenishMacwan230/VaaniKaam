import json
import os

files = ['en.json', 'hi.json', 'gu.json']
dir_path = 'client/messages'

additions = {
    'en.json': {
        "jobsCount": "jobs"
    },
    'hi.json': {
        "jobsCount": "नौकरियां"
    },
    'gu.json': {
        "jobsCount": "નોકરીઓ"
    }
}

for f in files:
    path = os.path.join(dir_path, f)
    with open(path, 'r', encoding='utf-8') as file:
        data = json.load(file)
    if 'helpers' not in data:
        data['helpers'] = {}
    data['helpers'].update(additions[f])
    with open(path, 'w', encoding='utf-8') as file:
        json.dump(data, file, ensure_ascii=False, indent=2)

print("JSONs updated")
