import json
import os
import re

files = ['en.json', 'hi.json', 'gu.json']
dir_path = 'client/messages'

en_dashboard = {
  "myWork": "My Work",
  "subtitle": "Jobs, applications & earnings",
  "findJobs": "Find Jobs",
  "back": "Back",
  "applied": "Applied",
  "active": "Active",
  "done": "Done",
  "earned": "Earned",
  "confirm": "Confirm",
  "noActiveJobs": "No active jobs",
  "noApplications": "No applications yet",
  "nothingToConfirm": "Nothing to confirm",
  "noCompletedJobs": "No completed jobs yet",
  "browseJobs": "Browse available jobs to get started",
  "by": "by {name}",
  "statusInProgress": "In Progress",
  "statusConfirm": "Confirm?",
  "reject": "Reject",
  "gotPaid": "Got paid",
  "issue": "Issue",
  "confirmed": "✓ Confirmed",
  "disputed": "⚠ Disputed",
  "details": "Details",
  "rateContractor": "Rate your contractor",
  "addReview": "Add a review (optional, max 200 chars)",
  "submitRating": "Submit Rating",
  "submitting": "Submitting...",
  "lookingForWork": "Looking for more work?",
  "browseMatch": "Browse jobs that match your skills"
}

hi_dashboard = {
  "myWork": "मेरा काम",
  "subtitle": "नौकरियां, आवेदन और कमाई",
  "findJobs": "नौकरियां खोजें",
  "back": "वापस",
  "applied": "लागू",
  "active": "सक्रिय",
  "done": "पूर्ण",
  "earned": "कमाया",
  "confirm": "पुष्टि करें",
  "noActiveJobs": "कोई सक्रिय नौकरी नहीं",
  "noApplications": "अभी तक कोई आवेदन नहीं",
  "nothingToConfirm": "पुष्टि करने के लिए कुछ नहीं",
  "noCompletedJobs": "अभी तक कोई पूरी नौकरी नहीं",
  "browseJobs": "शुरू करने के लिए उपलब्ध नौकरियां ब्राउज़ करें",
  "by": "{name} द्वारा",
  "statusInProgress": "प्रगति पर",
  "statusConfirm": "पुष्टि करें?",
  "reject": "अस्वीकार करें",
  "gotPaid": "पैसे मिल गए",
  "issue": "मुद्दा",
  "confirmed": "✓ पुष्टि की गई",
  "disputed": "⚠ विवादित",
  "details": "विवरण",
  "rateContractor": "अपने ठेकेदार को रेट करें",
  "addReview": "एक समीक्षा जोड़ें (वैकल्पिक, अधिकतम 200 वर्ण)",
  "submitRating": "रेटिंग सबमिट करें",
  "submitting": "सबमिट हो रहा है...",
  "lookingForWork": "और काम खोज रहे हैं?",
  "browseMatch": "अपने कौशल से मेल खाने वाली नौकरियां ब्राउज़ करें"
}

gu_dashboard = {
  "myWork": "મારું કામ",
  "subtitle": "નોકરીઓ, અરજીઓ અને કમાણી",
  "findJobs": "નોકરીઓ શોધો",
  "back": "પાછા",
  "applied": "અરજી કરી",
  "active": "સક્રિય",
  "done": "પૂર્ણ",
  "earned": "કમાયા",
  "confirm": "પુષ્ટિ કરો",
  "noActiveJobs": "કોઈ સક્રિય નોકરી નથી",
  "noApplications": "હજી સુધી કોઈ અરજી નથી",
  "nothingToConfirm": "પુષ્ટિ કરવા માટે કંઈ નથી",
  "noCompletedJobs": "હજી સુધી કોઈ પૂર્ણ નોકરી નથી",
  "browseJobs": "શરૂ કરવા માટે ઉપલબ્ધ નોકરીઓ બ્રાઉઝ કરો",
  "by": "{name} દ્વારા",
  "statusInProgress": "પ્રગતિમાં",
  "statusConfirm": "પુષ્ટિ કરો?",
  "reject": "નકારો",
  "gotPaid": "પૈસા મળી ગયા",
  "issue": "સમસ્યા",
  "confirmed": "✓ પુષ્ટિ થયેલ",
  "disputed": "⚠ વિવાદિત",
  "details": "વિગતો",
  "rateContractor": "તમારા કોન્ટ્રાક્ટરને રેટ કરો",
  "addReview": "સમીક્ષા ઉમેરો (વૈકલ્પિક, મહત્તમ 200 અક્ષરો)",
  "submitRating": "રેટિંગ સબમિટ કરો",
  "submitting": "સબમિટ થઈ રહ્યું છે...",
  "lookingForWork": "વધુ કામ શોધી રહ્યા છો?",
  "browseMatch": "તમારી કુશળતા સાથે મેળ ખાતી નોકરીઓ બ્રાઉઝ કરો"
}

dicts = {'en.json': en_dashboard, 'hi.json': hi_dashboard, 'gu.json': gu_dashboard}

for f in files:
    path = os.path.join(dir_path, f)
    with open(path, 'r', encoding='utf-8') as file:
        data = json.load(file)
    data['workerDashboard'] = dicts[f]
    with open(path, 'w', encoding='utf-8') as file:
        json.dump(data, file, ensure_ascii=False, indent=2)

with open("client/app/[locale]/dashboard/worker/page.tsx", "r", encoding="utf-8") as f:
    content = f.read()

if 'import { useTranslations } from "next-intl";' not in content:
    content = content.replace('import { usePathname, useRouter } from "next/navigation";', 'import { usePathname, useRouter } from "next/navigation";\nimport { useTranslations } from "next-intl";')

if 'const t = useTranslations("workerDashboard");' not in content:
    content = content.replace('export default function WorkerDashboardPage() {', 'export default function WorkerDashboardPage() {\n  const t = useTranslations("workerDashboard");')

replacements = [
    ('label: "Active",', 'label: t("active"),'),
    ('label: "Applied",', 'label: t("applied"),'),
    ('label: "Confirm",', 'label: t("confirm"),'),
    ('label: "Done",', 'label: t("done"),'),
    ('>My Work<', '>{t("myWork")}<'),
    ('>Jobs, applications & earnings<', '>{t("subtitle")}<'),
    ('> Find Jobs<', '> {t("findJobs")}<'),
    ('<span>Back</span>', '<span>{t("back")}</span>'),
    ('Applied`', '`${t("applied")}`'),
    ('Active`', '`${t("active")}`'),
    ('Done`', '`${t("done")}`'),
    ('label: "Earned",', 'label: t("earned"),'),
    ('"No active jobs"', 't("noActiveJobs")'),
    ('"No applications yet"', 't("noApplications")'),
    ('"Nothing to confirm"', 't("nothingToConfirm")'),
    ('"No completed jobs yet"', 't("noCompletedJobs")'),
    ('>Browse available jobs to get started<', '>{t("browseJobs")}<'),
    ('by {job.postedBy.name}', '{t("by", { name: job.postedBy.name })}'),
    ('Confirm\n', '{t("confirm")}\n'),
    ('Reject\n', '{t("reject")}\n'),
    ('Got paid', '{t("gotPaid")}'),
    ('Issue\n', '{t("issue")}\n'),
    ('>✓ Confirmed<', '>{t("confirmed")}<'),
    ('>⚠ Disputed<', '>{t("disputed")}<'),
    ('Details ', '{t("details")} '),
    ('>Rate your contractor<', '>{t("rateContractor")}<'),
    ('placeholder="Add a review (optional, max 200 chars)"', 'placeholder={t("addReview")}'),
    ('Submitting...', '{t("submitting")}'),
    ('Submit Rating', '{t("submitRating")}'),
    ('>Looking for more work?<', '>{t("lookingForWork")}<'),
    ('>Browse jobs that match your skills<', '>{t("browseMatch")}<'),
    ('applied: "Applied",', 'applied: t("applied"),'),
    ('accepted: "In Progress",', 'accepted: t("statusInProgress"),'),
    ('completion_pending: "Confirm?",', 'completion_pending: t("statusConfirm"),'),
    ('completed: "Done",', 'completed: t("done"),')
]

for old, new in replacements:
    content = content.replace(old, new)

# specifically targeting the TABS mapping which is outside the component
if 'const TABS = [' not in content and 'TABS: { id: TabId; label: string; icon: React.ElementType }[] = [' in content:
    # Need to move TABS inside the component, or remove label from TABS definition and render it via id
    content = content.replace('const TABS: { id: TabId; label: string; icon: React.ElementType }[] = [\n  { id: "active",    label: "Active",    icon: Clock },\n  { id: "applied",   label: "Applied",   icon: Briefcase },\n  { id: "pending",   label: "Confirm",   icon: AlertCircle },\n  { id: "completed", label: "Done",      icon: CheckCircle },\n];', 'const TABS: { id: TabId; icon: React.ElementType }[] = [\n  { id: "active", icon: Clock },\n  { id: "applied", icon: Briefcase },\n  { id: "pending", icon: AlertCircle },\n  { id: "completed", icon: CheckCircle },\n];')
    
    # Also fix where TABS is mapped
    content = content.replace('TABS.map(({ id, label, icon: Icon }) => {', 'TABS.map(({ id, icon: Icon }) => {\n            const label = id === "active" ? t("active") : id === "applied" ? t("applied") : id === "pending" ? t("confirm") : t("done");')

with open("client/app/[locale]/dashboard/worker/page.tsx", "w", encoding="utf-8") as f:
    f.write(content)
