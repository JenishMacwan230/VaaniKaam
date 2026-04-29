import json
import os
import re

files = ['en.json', 'hi.json', 'gu.json']
dir_path = 'client/messages'

en_helpers = {
  "title": "Find Workers",
  "subtitle": "Search and connect with verified local workers",
  "workers": "Workers",
  "availableNow": "Available Now",
  "verifiedProfiles": "Verified Profiles",
  "searchPlaceholder": "Search by name or profession…",
  "cityPlaceholder": "City (e.g., Surat, Bilimora)",
  "useLocation": "Use my current location",
  "filters": "Filters",
  "filterWorkers": "Filter Workers",
  "distance": "Distance",
  "anyDistance": "Any distance",
  "within3km": "Within 3 km",
  "within5km": "Within 5 km",
  "within10km": "Within 10 km",
  "within20km": "Within 20 km",
  "profession": "Profession",
  "allProfessions": "All professions",
  "minRating": "Minimum Rating",
  "anyRating": "Any rating",
  "rating1": "1.0 and above",
  "rating2": "2.0 and above",
  "rating3": "3.0 and above",
  "rating35": "3.5 and above",
  "rating4": "4.0 and above",
  "rating45": "4.5 and above",
  "rating48": "4.8 and above",
  "rating5": "5.0",
  "availability": "Availability",
  "allWorkers": "All workers",
  "unavailable": "Unavailable",
  "applyFilters": "Apply Filters",
  "reset": "Reset",
  "workersFound": "{count} workers found",
  "workerFound": "{count} worker found",
  "findingTalent": "Finding local talent...",
  "tryAgain": "Try Again",
  "noWorkers": "No workers found",
  "adjustFilters": "Try adjusting your filters or search terms.",
  "available": "Available",
  "call": "Call",
  "chat": "Chat"
}

hi_helpers = {
  "title": "श्रमिक खोजें",
  "subtitle": "सत्यापित स्थानीय श्रमिकों को खोजें और संपर्क करें",
  "workers": "श्रमिक",
  "availableNow": "अभी उपलब्ध",
  "verifiedProfiles": "सत्यापित प्रोफ़ाइल",
  "searchPlaceholder": "नाम या पेशे से खोजें…",
  "cityPlaceholder": "शहर (उदा. सूरत, बिलिमोरा)",
  "useLocation": "मेरे वर्तमान स्थान का उपयोग करें",
  "filters": "फ़िल्टर",
  "filterWorkers": "श्रमिक फ़िल्टर करें",
  "distance": "दूरी",
  "anyDistance": "कोई भी दूरी",
  "within3km": "3 किमी के भीतर",
  "within5km": "5 किमी के भीतर",
  "within10km": "10 किमी के भीतर",
  "within20km": "20 किमी के भीतर",
  "profession": "पेशा",
  "allProfessions": "सभी पेशे",
  "minRating": "न्यूनतम रेटिंग",
  "anyRating": "कोई भी रेटिंग",
  "rating1": "1.0 और अधिक",
  "rating2": "2.0 और अधिक",
  "rating3": "3.0 और अधिक",
  "rating35": "3.5 और अधिक",
  "rating4": "4.0 और अधिक",
  "rating45": "4.5 और अधिक",
  "rating48": "4.8 और अधिक",
  "rating5": "5.0",
  "availability": "उपलब्धता",
  "allWorkers": "सभी श्रमिक",
  "unavailable": "अनुपलब्ध",
  "applyFilters": "फ़िल्टर लागू करें",
  "reset": "रीसेट",
  "workersFound": "{count} श्रमिक मिले",
  "workerFound": "{count} श्रमिक मिला",
  "findingTalent": "स्थानीय प्रतिभा खोजना...",
  "tryAgain": "पुनः प्रयास करें",
  "noWorkers": "कोई श्रमिक नहीं मिला",
  "adjustFilters": "अपने फ़िल्टर या खोज शब्दों को बदलने का प्रयास करें।",
  "available": "उपलब्ध",
  "call": "कॉल करें",
  "chat": "चैट"
}

gu_helpers = {
  "title": "કામદારો શોધો",
  "subtitle": "ચકાસાયેલ સ્થાનિક કામદારોને શોધો અને સંપર્ક કરો",
  "workers": "કામદારો",
  "availableNow": "હવે ઉપલબ્ધ",
  "verifiedProfiles": "ચકાસાયેલ પ્રોફાઇલ્સ",
  "searchPlaceholder": "નામ અથવા વ્યવસાય દ્વારા શોધો…",
  "cityPlaceholder": "શહેર (દા.ત., સુરત, બિલીમોરા)",
  "useLocation": "મારા વર્તમાન સ્થાનનો ઉપયોગ કરો",
  "filters": "ફિલ્ટર્સ",
  "filterWorkers": "કામદારો ફિલ્ટર કરો",
  "distance": "અંતર",
  "anyDistance": "કોઈપણ અંતર",
  "within3km": "3 કિમીની અંદર",
  "within5km": "5 કિમીની અંદર",
  "within10km": "10 કિમીની અંદર",
  "within20km": "20 કિમીની અંદર",
  "profession": "વ્યવસાય",
  "allProfessions": "તમામ વ્યવસાયો",
  "minRating": "ન્યૂનતમ રેટિંગ",
  "anyRating": "કોઈપણ રેટિંગ",
  "rating1": "1.0 અને વધુ",
  "rating2": "2.0 અને વધુ",
  "rating3": "3.0 અને વધુ",
  "rating35": "3.5 અને વધુ",
  "rating4": "4.0 અને વધુ",
  "rating45": "4.5 અને વધુ",
  "rating48": "4.8 અને વધુ",
  "rating5": "5.0",
  "availability": "ઉપલબ્ધતા",
  "allWorkers": "તમામ કામદારો",
  "unavailable": "અનુપલબ્ધ",
  "applyFilters": "ફિલ્ટર્સ લાગુ કરો",
  "reset": "રીસેટ કરો",
  "workersFound": "{count} કામદારો મળ્યા",
  "workerFound": "{count} કામદાર મળ્યો",
  "findingTalent": "સ્થાનિક પ્રતિભા શોધી રહ્યા છીએ...",
  "tryAgain": "ફરી પ્રયાસ કરો",
  "noWorkers": "કોઈ કામદારો મળ્યા નથી",
  "adjustFilters": "તમારા ફિલ્ટર્સ અથવા શોધ શબ્દોને સમાયોજિત કરવાનો પ્રયાસ કરો.",
  "available": "ઉપલબ્ધ",
  "call": "કૉલ કરો",
  "chat": "ચેટ કરો"
}

dicts = {'en.json': en_helpers, 'hi.json': hi_helpers, 'gu.json': gu_helpers}

for f in files:
    path = os.path.join(dir_path, f)
    with open(path, 'r', encoding='utf-8') as file:
        data = json.load(file)
    data['helpers'] = dicts[f]
    with open(path, 'w', encoding='utf-8') as file:
        json.dump(data, file, ensure_ascii=False, indent=2)

with open("client/app/[locale]/helpers/page.tsx", "r", encoding="utf-8") as f:
    content = f.read()

if 'import { useTranslations } from "next-intl";' not in content:
    content = content.replace('import { fetchSessionUser } from "@/lib/authClient";', 'import { fetchSessionUser } from "@/lib/authClient";\nimport { useTranslations } from "next-intl";')

if 'const t = useTranslations("helpers");' not in content:
    content = content.replace('export default function WorkersPage() {', 'export default function WorkersPage() {\n  const t = useTranslations("helpers");')

if 'const t = useTranslations("helpers");' not in content:
    content = content.replace('function WorkerCard({ worker }: { worker: Worker }) {', 'function WorkerCard({ worker }: { worker: Worker }) {\n  const t = useTranslations("helpers");')

replacements = [
    ('>Find Workers<', '>{t("title")}<'),
    ('>Search and connect with verified local workers<', '>{t("subtitle")}<'),
    ('`${workers.length} Workers`', '`${workers.length} ${t("workers")}`'),
    ('`${workers.filter((w) => w.isAvailable).length} Available Now`', '`${workers.filter((w) => w.isAvailable).length} ${t("availableNow")}`'),
    ('"Verified Profiles"', 't("verifiedProfiles")'),
    ('placeholder="Search by name or profession…"', 'placeholder={t("searchPlaceholder")}'),
    ('placeholder="City (e.g., Surat, Bilimora)"', 'placeholder={t("cityPlaceholder")}'),
    ('title="Use my current location"', 'title={t("useLocation")}'),
    ('Filters\n', '{t("filters")}\n'),
    ('>Filter Workers<', '>{t("filterWorkers")}<'),
    ('>📍 Distance<', '>📍 {t("distance")}<'),
    ('>Any distance<', '>{t("anyDistance")}<'),
    ('>Within 3 km<', '>{t("within3km")}<'),
    ('>Within 5 km<', '>{t("within5km")}<'),
    ('>Within 10 km<', '>{t("within10km")}<'),
    ('>Within 20 km<', '>{t("within20km")}<'),
    ('>🧰 Profession<', '>🧰 {t("profession")}<'),
    ('>All professions<', '>{t("allProfessions")}<'),
    ('>⭐ Minimum Rating<', '>⭐ {t("minRating")}<'),
    ('>Any rating<', '>{t("anyRating")}<'),
    ('>1.0 and above<', '>{t("rating1")}<'),
    ('>2.0 and above<', '>{t("rating2")}<'),
    ('>3.0 and above<', '>{t("rating3")}<'),
    ('>3.5 and above<', '>{t("rating35")}<'),
    ('>4.0 and above<', '>{t("rating4")}<'),
    ('>4.5 and above<', '>{t("rating45")}<'),
    ('>4.8 and above<', '>{t("rating48")}<'),
    ('>5.0<', '>{t("rating5")}<'),
    ('>🟢 Availability<', '>🟢 {t("availability")}<'),
    ('>All workers<', '>{t("allWorkers")}<'),
    ('>Available now<', '>{t("availableNow")}<'),
    ('>Unavailable<', '>{t("unavailable")}<'),
    ('Apply Filters', '{t("applyFilters")}'),
    ('Reset\n', '{t("reset")}\n'),
    ('worker{filteredWorkers.length !== 1 ? "s" : ""} found', '{filteredWorkers.length === 1 ? t("workerFound", { count: filteredWorkers.length }) : t("workersFound", { count: filteredWorkers.length })}'),
    ('>Finding local talent...<', '>{t("findingTalent")}<'),
    ('>Try Again<', '>{t("tryAgain")}<'),
    ('>No workers found<', '>{t("noWorkers")}<'),
    ('>Try adjusting your filters or search terms.<', '>{t("adjustFilters")}<'),
    ('? "Available" : "Unavailable"', '? t("available") : t("unavailable")'),
    ('Call\n', '{t("call")}\n'),
    ('Chat\n', '{t("chat")}\n')
]

for old, new in replacements:
    content = content.replace(old, new)

with open("client/app/[locale]/helpers/page.tsx", "w", encoding="utf-8") as f:
    f.write(content)
