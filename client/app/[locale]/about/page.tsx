"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { useTranslations } from "next-intl";

export default function AboutUsPage() {
  const router = useRouter();
  const t = useTranslations("about");

  return (
    <main className="min-h-screen bg-background text-foreground">
      {/* ================= HERO ================= */}
      <section className="container mx-auto px-6 py-20">
        <div className="mb-8 flex justify-start max-w-3xl mx-auto">
          <button
            type="button"
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/80 px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-accent/50 hover:text-accent-foreground transition-colors shadow-sm"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>{t("back")}</span>
          </button>
        </div>

        <div className="text-center max-w-3xl mx-auto">
          <h1 className="text-4xl sm:text-5xl font-bold mb-6">
            {t("heroTitle")} <span className="text-primary">{t("heroTitleBrand1")}</span>
            <span className="text-secondary inline-block ml-1 -skew-x-6">
              {t("heroTitleBrand2")}
            </span>
          </h1>
          <p className="text-xl text-muted-foreground">
            {t("heroDesc")}
          </p>
        </div>
      </section>

      {/* ================= MISSION ================= */}
      <section className="container mx-auto px-6 py-16">
        <div className="grid gap-12 md:grid-cols-2 items-center max-w-5xl mx-auto">
          <div>
            <h2 className="text-3xl font-bold mb-4">
              {t("missionTitle")} <span className="text-primary">{t("missionBrand")}</span>
            </h2>
            <p className="text-lg text-muted-foreground leading-relaxed mb-6">
              {t("missionDesc")}
            </p>
          </div>

          <div className="bg-card p-8 rounded-lg border shadow-sm">
            <ul className="space-y-6">
              <li className="flex gap-4">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex-shrink-0 flex items-center justify-center">
                  <div className="h-2.5 w-2.5 rounded-full bg-primary" />
                </div>
                <span className="text-foreground font-medium pt-1">{t("missionPoint1")}</span>
              </li>
              <li className="flex gap-4">
                <div className="h-8 w-8 rounded-full bg-secondary/10 flex-shrink-0 flex items-center justify-center">
                  <div className="h-2.5 w-2.5 rounded-full bg-secondary" />
                </div>
                <span className="text-foreground font-medium pt-1">{t("missionPoint2")}</span>
              </li>
              <li className="flex gap-4">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex-shrink-0 flex items-center justify-center">
                  <div className="h-2.5 w-2.5 rounded-full bg-primary" />
                </div>
                <span className="text-foreground font-medium pt-1">{t("missionPoint3")}</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* ================= WHY VAANIKAAM ================= */}
      <section className="bg-muted/30 py-16">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-12">
            {t("whyTitle")} <span className="text-primary">{t("whyBrand1")}</span>
            <span className="text-secondary inline-block ml-1 -skew-x-6">
              {t("whyBrand2")}
            </span>
            ?
          </h2>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              {
                title: t("why1Title"),
                desc: t("why1Desc"),
                icon: "🎤",
                color: "bg-primary/10",
              },
              {
                title: t("why2Title"),
                desc: t("why2Desc"),
                icon: "🇮🇳",
                color: "bg-secondary/10",
              },
              {
                title: t("why3Title"),
                desc: t("why3Desc"),
                icon: "🛡️",
                color: "bg-primary/10",
              },
            ].map((item, idx) => (
              <div
                key={idx}
                className="bg-card p-6 rounded-lg border shadow-sm hover:shadow-md transition"
              >
                <div className={`h-12 w-12 rounded-full ${item.color} flex items-center justify-center mb-4`}>
                  <span className="text-2xl">{item.icon}</span>
                </div>
                <h3 className="text-xl font-semibold mb-2">
                  {item.title}
                </h3>
                <p className="text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================= VISION ================= */}
      <section className="container mx-auto px-6 py-20">
        <div className="text-center max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold mb-6">
            {t("visionTitle")} <span className="text-primary">{t("visionBrand")}</span>
          </h2>
          <p className="text-muted-foreground text-xl mb-16">
            {t("visionDesc")}
          </p>
        </div>
      </section>

      {/* ================= PROJECT BACKGROUND ================= */}
      <section className="bg-muted/50 py-16 border-t pb-24">
        <div className="container mx-auto px-6 text-center">
          <div className="inline-flex items-center justify-center p-3 mb-6 rounded-full bg-primary/10 text-primary">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-graduation-cap"><path d="M21.42 10.922a2 2 0 0 0-.019-3.138L13.153 1.077a2 2 0 0 0-2.306 0L2.601 7.784a2 2 0 0 0-.019 3.138l8.246 6.706a2 2 0 0 0 2.344 0l8.248-6.706z"/><path d="M22 10v6"/><path d="M6 12.5V16a6 3 0 0 0 12 0v-3.5"/></svg>
          </div>
          <h2 className="text-3xl font-bold mb-6">
            {t("academicTitle")} <span className="text-primary">{t("academicBrand")}</span>
          </h2>
          <div className="max-w-4xl mx-auto bg-card p-8 rounded-lg border shadow-sm text-left">
            <p className="text-lg text-muted-foreground leading-relaxed mb-4">
              {t("academicDesc1")}
            </p>
            <p className="text-lg text-muted-foreground leading-relaxed">
              {t("academicDesc2")}
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
