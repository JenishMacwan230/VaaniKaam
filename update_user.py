import json
import os
import re

files = ['en.json', 'hi.json', 'gu.json']
dir_path = 'client/messages'

en_user = {
  "loading": "Loading your account…",
  "signedInAs": "Signed in as",
  "defaultName": "User",
  "noContact": "No contact details added yet",
  "contractor": "Contractor",
  "worker": "Worker",
  "verified": "Verified",
  "accountCentre": "Account Centre",
  "profileTitle": "Profile",
  "profileDesc": "View and edit your personal details, skills and languages.",
  "dashboardTitle": "Dashboard",
  "dashboardDesc": "Track your work, availability and profile completion.",
  "helpTitle": "Help & Support",
  "helpDesc": "Get help with using VaaniKaam or report an issue.",
  "aboutTitle": "About Us",
  "aboutDesc": "Learn more about the VaaniKaam mission and vision.",
  "logOut": "Log Out",
  "manageSettings": "Manage all your VaaniKaam settings and pages from here."
}

hi_user = {
  "loading": "आपका खाता लोड हो रहा है…",
  "signedInAs": "के रूप में साइन इन किया",
  "defaultName": "उपयोगकर्ता",
  "noContact": "अभी तक कोई संपर्क विवरण नहीं जोड़ा गया",
  "contractor": "ठेकेदार",
  "worker": "श्रमिक",
  "verified": "सत्यापित",
  "accountCentre": "खाता केंद्र",
  "profileTitle": "प्रोफ़ाइल",
  "profileDesc": "अपने व्यक्तिगत विवरण, कौशल और भाषाएं देखें और संपादित करें।",
  "dashboardTitle": "डैशबोर्ड",
  "dashboardDesc": "अपने काम, उपलब्धता और प्रोफ़ाइल पूर्णता को ट्रैक करें।",
  "helpTitle": "सहायता और समर्थन",
  "helpDesc": "VaaniKaam का उपयोग करने में सहायता प्राप्त करें या किसी समस्या की रिपोर्ट करें।",
  "aboutTitle": "हमारे बारे में",
  "aboutDesc": "VaaniKaam मिशन और विजन के बारे में अधिक जानें।",
  "logOut": "लॉग आउट",
  "manageSettings": "यहां से अपनी सभी VaaniKaam सेटिंग्स और पेज प्रबंधित करें।"
}

gu_user = {
  "loading": "તમારું ખાતું લોડ થઈ રહ્યું છે…",
  "signedInAs": "તરીકે સાઇન ઇન કર્યું",
  "defaultName": "વપરાશકર્તા",
  "noContact": "હજી સુધી કોઈ સંપર્ક વિગતો ઉમેરવામાં આવી નથી",
  "contractor": "કોન્ટ્રાક્ટર",
  "worker": "કામદાર",
  "verified": "ચકાસાયેલ",
  "accountCentre": "એકાઉન્ટ સેન્ટર",
  "profileTitle": "પ્રોફાઇલ",
  "profileDesc": "તમારી વ્યક્તિગત વિગતો, કુશળતા અને ભાષાઓ જુઓ અને સંપાદિત કરો.",
  "dashboardTitle": "ડેશબોર્ડ",
  "dashboardDesc": "તમારું કાર્ય, ઉપલબ્ધતા અને પ્રોફાઇલ પૂર્ણતાને ટ્રૅક કરો.",
  "helpTitle": "સહાય અને સપોર્ટ",
  "helpDesc": "VaaniKaam નો ઉપયોગ કરવા માટે મદદ મેળવો અથવા સમસ્યાની જાણ કરો.",
  "aboutTitle": "અમારા વિશે",
  "aboutDesc": "VaaniKaam મિશન અને વિઝન વિશે વધુ જાણો.",
  "logOut": "લૉગ આઉટ",
  "manageSettings": "અહીંથી તમારી બધી VaaniKaam સેટિંગ્સ અને પૃષ્ઠોનું સંચાલન કરો."
}

dicts = {'en.json': en_user, 'hi.json': hi_user, 'gu.json': gu_user}

for f in files:
    path = os.path.join(dir_path, f)
    with open(path, 'r', encoding='utf-8') as file:
        data = json.load(file)
    data['userPage'] = dicts[f]
    with open(path, 'w', encoding='utf-8') as file:
        json.dump(data, file, ensure_ascii=False, indent=2)

with open("client/app/[locale]/user/page.tsx", "r", encoding="utf-8") as f:
    content = f.read()

if 'import { useTranslations } from "next-intl";' not in content:
    content = content.replace('import { ProfilePictureManager } from "@/components/ProfilePictureManager";', 'import { ProfilePictureManager } from "@/components/ProfilePictureManager";\nimport { useTranslations } from "next-intl";')

if 'const t = useTranslations("userPage");' not in content:
    content = content.replace('export default function UserHubPage() {', 'export default function UserHubPage() {\n  const t = useTranslations("userPage");')

replacements = [
    ('>Loading your account…<', '>{t("loading")}<'),
    ('>Signed in as<', '>{t("signedInAs")}<'),
    ('"User"', 't("defaultName")'),
    ('"No contact details added yet"', 't("noContact")'),
    ('"Contractor" : "Worker"', 't("contractor") : t("worker")'),
    ('>Verified<', '>{t("verified")}<'),
    ('>Account Centre<', '>{t("accountCentre")}<'),
    ('title: "Profile",', 'title: t("profileTitle"),'),
    ('description: "View and edit your personal details, skills and languages.",', 'description: t("profileDesc"),'),
    ('title: "Dashboard",', 'title: t("dashboardTitle"),'),
    ('description: "Track your work, availability and profile completion.",', 'description: t("dashboardDesc"),'),
    ('title: "Help & Support",', 'title: t("helpTitle"),'),
    ('description: "Get help with using VaaniKaam or report an issue.",', 'description: t("helpDesc"),'),
    ('title: "About Us",', 'title: t("aboutTitle"),'),
    ('description: "Learn more about the VaaniKaam mission and vision.",', 'description: t("aboutDesc"),'),
    ('Log Out\n', '{t("logOut")}\n'),
    ('>Manage all your VaaniKaam settings and pages from here.<', '>{t("manageSettings")}<'),
]

for old, new in replacements:
    content = content.replace(old, new)

with open("client/app/[locale]/user/page.tsx", "w", encoding="utf-8") as f:
    f.write(content)
