'use client';

import { useTranslations } from "next-intl";
import Link from "next/link";

export default function ProjectsPage() {
  const t = useTranslations("projects");

  return (
    <main className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="container mx-auto px-6 py-20">
        <div className="text-center max-w-3xl mx-auto">
          <h1 className="text-4xl sm:text-5xl font-bold mb-6">
            {t("title")}
          </h1>
          <p className="text-xl text-muted-foreground mb-4">
            {t("subtitle")}
          </p>
          <p className="text-lg text-muted-foreground">
            {t("description")}
          </p>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-muted/30 py-16">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="bg-card p-6 rounded-lg border shadow-sm">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <span className="text-2xl">📋</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">
                {t("feature1Title")}
              </h3>
              <p className="text-muted-foreground">
                {t("feature1Desc")}
              </p>
            </div>

            <div className="bg-card p-6 rounded-lg border shadow-sm">
              <div className="h-12 w-12 rounded-full bg-secondary/10 flex items-center justify-center mb-4">
                <span className="text-2xl">🛠️</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">
                {t("feature2Title")}
              </h3>
              <p className="text-muted-foreground">
                {t("feature2Desc")}
              </p>
            </div>

            <div className="bg-card p-6 rounded-lg border shadow-sm">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <span className="text-2xl">💰</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">
                {t("feature3Title")}
              </h3>
              <p className="text-muted-foreground">
                {t("feature3Desc")}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-6 py-20">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">
            {t("ctaTitle")}
          </h2>
          <p className="text-lg text-muted-foreground mb-8">
            {t("ctaDesc")}
          </p>
          <Link 
            href="/create-account"
            className="inline-block bg-primary text-primary-foreground px-8 py-3 rounded-lg font-semibold hover:bg-primary/90 transition-colors"
          >
            {t("ctaButton")}
          </Link>
        </div>
      </section>
    </main>
  );
}
