const featureCards = [
  {
    title: "Shift tracking",
    desc: "Daily attendance & payouts synced to your dashboard.",
  },
  {
    title: "Project insights",
    desc: "Visual reports powered by your site activity.",
  },
];

export default function EngagementPanel() {
  return (
    <section className="relative overflow-hidden rounded-3xl border border-border bg-card/90 p-8 shadow-2xl">
      <div className="absolute inset-0 opacity-10" style={{ background: "var(--brand-gradient)" }} />
      <div className="relative space-y-6">
        <p className="text-sm uppercase tracking-[0.4em] text-muted-foreground">VaaniKaam</p>
        <h1 className="text-4xl font-semibold leading-tight">
          Reconnect with skilled <span className="text-primary">workers</span> in seconds.
        </h1>
        <p className="text-base text-muted-foreground">
          Sign in with your registered mobile number and continue managing gigs, crews, and payroll seamlessly across every site.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          {featureCards.map((feature) => (
            <div key={feature.title} className="rounded-2xl border border-border/70 bg-background/40 p-4">
              <p className="text-sm font-semibold text-primary">{feature.title}</p>
              <p className="text-sm text-muted-foreground">{feature.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
