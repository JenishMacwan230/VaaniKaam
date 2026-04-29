import re

with open("client/app/[locale]/page.tsx", "r", encoding="utf-8") as f:
    content = f.read()

if 'import { useTranslations } from "next-intl";' not in content:
    content = content.replace('import { UserMenu } from "@/components/UserMenu";', 'import { UserMenu } from "@/components/UserMenu";\nimport { useTranslations } from "next-intl";')

if 'const t = useTranslations("home");' not in content:
    content = content.replace('const HomePage: React.FC = () => {', 'const HomePage: React.FC = () => {\n  const t = useTranslations("home");')

replacements = [
    ('>Loading…<', '>{t("loading")}<'),
    ('>Find Your Perfect<', '>{t("heroTitle1")}<'),
    ('>Opportunity Today<', '>{t("heroTitle2")}<'),
    ('Connect talented workers with amazing opportunities. Build your career with India\'s most trusted work platform.', '{t("heroDesc")}'),
    ('>Find Jobs ', '>{t("findJobs")} '),
    ('>Dashboard<', '>{t("dashboard")}<'),
    ('>Get Started ', '>{t("getStarted")} '),
    ('>Sign In<', '>{t("signIn")}<'),
    ('value="10K+" label="Active Users"', 'value="10K+" label={t("activeUsers")}'),
    ('value="5K+" label="Jobs Posted"', 'value="5K+" label={t("jobsPosted")}'),
    ('value="4.8★" label="Avg Rating"', 'value="4.8★" label={t("avgRating")}'),
    ('title="Why Choose VaaniKaam?"', 'title={t("whyChoose")}'),
    ('title="Quick Apply" desc="Apply in seconds with your verified profile"', 'title={t("quickApply")} desc={t("quickApplyDesc")}'),
    ('title="Verified Workers" desc="All workers pass background verification"', 'title={t("verifiedWorkers")} desc={t("verifiedWorkersDesc")}'),
    ('title="24/7 Support" desc="Round-the-clock support for every query"', 'title={t("support")} desc={t("supportDesc")}'),
    ('title="Ratings & Reviews" desc="Build reputation with genuine client reviews"', 'title={t("ratingsReviews")} desc={t("ratingsReviewsDesc")}'),
    ('title="Popular Jobs Near You" subtitle="Opportunities matched to your location"', 'title={t("popularJobs")} subtitle={t("popularJobsDesc")}'),
    ('>View Job<', '>{t("viewJob")}<'),
    ('>View All Jobs ', '>{t("viewAllJobs")} '),
    ('title="How It Works"', 'title={t("howItWorks")}'),
    ('title: "Create Profile", desc: "Sign up in minutes"', 'title: t("createProfile"), desc: t("createProfileDesc")'),
    ('title: "Browse Jobs", desc: "Find matching opportunities"', 'title: t("browseJobs"), desc: t("browseJobsDesc")'),
    ('title: "Apply Instantly", desc: "One-tap job applications"', 'title: t("applyInstantly"), desc: t("applyInstantlyDesc")'),
    ('title: "Get Hired", desc: "Start earning right away"', 'title: t("getHired"), desc: t("getHiredDesc")'),
    ('title="Manage Your Contracts" subtitle="Track active projects and earnings"', 'title={t("manageContracts")} subtitle={t("manageContractsDesc")}'),
    ('badge="Active"', 'badge={t("active")}'),
    ('label="Active Contracts"', 'label={t("activeContracts")}'),
    ('btnLabel="View All"', 'btnLabel={t("viewAll")}'),
    ('badge="This Month"', 'badge={t("thisMonth")}'),
    ('label="Total Earnings"', 'label={t("totalEarnings")}'),
    ('btnLabel="Withdraw"', 'btnLabel={t("withdraw")}'),
    ('badge="Pending"', 'badge={t("pending")}'),
    ('label="Pending Projects"', 'label={t("pendingProjects")}'),
    ('btnLabel="Review"', 'btnLabel={t("review")}'),
    ('value="96%" label="Completion Rate"', 'value="96%" label={t("completionRate")}'),
    ('value="4.9★" label="Average Rating"', 'value="4.9★" label={t("averageRating")}'),
    ('value="28" label="Total Projects"', 'value="28" label={t("totalProjects")}'),
    ('value="<2 hr" label="Response Time"', 'value="<2 hr" label={t("responseTime")}'),
    ('title="Your Work Stats" subtitle="Track your progress and opportunities"', 'title={t("yourWorkStats")} subtitle={t("yourWorkStatsDesc")}'),
    ('label="Job Applications"', 'label={t("jobApplications")}'),
    ('badge="Total"', 'badge={t("total")}'),
    ('btnLabel="History"', 'btnLabel={t("history")}'),
    ('label="Profile Views"', 'label={t("profileViews")}'),
    ('btnLabel="Update Profile"', 'btnLabel={t("updateProfile")}'),
    ('value="42" label="Jobs Completed"', 'value="42" label={t("jobsCompleted")}'),
    ('value="98%" label="On-time Rate"', 'value="98%" label={t("onTimeRate")}'),
    ('value="15" label="Repeat Clients"', 'value="15" label={t("repeatClients")}'),
    ('value="30 min" label="Avg Response"', 'value="30 min" label={t("avgResponse")}'),
    ('title="Trending Categories"', 'title={t("trendingCategories")}'),
    ('label="Plumbing"', 'label={t("plumbing")}'),
    ('label="Construction"', 'label={t("construction")}'),
    ('label="Cleaning"', 'label={t("cleaning")}'),
    ('label="Painting"', 'label={t("painting")}'),
    ('label="Electrical"', 'label={t("electrical")}'),
    ('label="Carpentry"', 'label={t("carpentry")}'),
    ('>Empowering workers and businesses across India<', '>{t("footerTagline")}<'),
    ('["About", "Terms", "Privacy"]', '[t("footerAbout"), t("footerTerms"), t("footerPrivacy")]'),
    ('>© 2026 VaaniKaam. All rights reserved.<', '>{t("footerCopyright")}<')
]

for old, new in replacements:
    content = content.replace(old, new)

with open("client/app/[locale]/page.tsx", "w", encoding="utf-8") as f:
    f.write(content)
