import json
import os

files = ['en.json', 'hi.json', 'gu.json']
dir_path = 'client/messages'

additions = {
    'en.json': {
        "within3km": "Within 3 km",
        "within5km": "Within 5 km",
        "within10km": "Within 10 km",
        "within20km": "Within 20 km",
    },
    'hi.json': {
        "within3km": "3 किमी के भीतर",
        "within5km": "5 किमी के भीतर",
        "within10km": "10 किमी के भीतर",
        "within20km": "20 किमी के भीतर",
    },
    'gu.json': {
        "within3km": "3 કિમીની અંદર",
        "within5km": "5 કિમીની અંદર",
        "within10km": "10 કિમીની અંદર",
        "within20km": "20 કિમીની અંદર",
    }
}

for f in files:
    path = os.path.join(dir_path, f)
    with open(path, 'r', encoding='utf-8') as file:
        data = json.load(file)
    if 'findWork' not in data:
        data['findWork'] = {}
    data['findWork'].update(additions[f])
    with open(path, 'w', encoding='utf-8') as file:
        json.dump(data, file, ensure_ascii=False, indent=2)

print("JSONs updated")
