import { Building2, ShieldCheck, Sparkles, Waypoints } from "lucide-react";

const highlights = [
  {
    title: "ID-verified workforce",
    desc: "Each worker is KYC verified and tagged to your contractor code.",
    Icon: ShieldCheck,
  },
  {
    title: "Site-level control",
    desc: "Assign crews, track shifts, and release payouts from one hub.",
    Icon: Building2,
  },
  {
    title: "Predictive demand",
    desc: "Plan hiring waves with real-time availability signals.",
    Icon: Sparkles,
  },
  {
    title: "Compliance trail",
    desc: "Export-ready logs for audits across every geography.",
    Icon: Waypoints,
  },
];

const stats = [
  { value: "48k+", label: "Workers activated" },
  { value: "320", label: "Sites onboarded" },
  { value: "2.4M", label: "Shifts logged" },
];

export default function ShowcasePanel() {
  return (
    <section className="relative overflow-hidden rounded-4xl border border-border bg-card/70 p-10 shadow-2xl">
      <div className="absolute inset-0 opacity-15" style={{ background: "var(--brand-gradient)" }} />
      <div className="relative space-y-8">
        <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/50 px-4 py-2 text-sm font-medium text-muted-foreground">
          <ShieldCheck className="h-4 w-4 text-primary" />
          Trusted workforce OS
        </div>
        <div>
          <p className="text-sm uppercase tracking-[0.45em] text-muted-foreground">VaaniKaam</p>
          <h1 className="mt-4 text-4xl font-semibold leading-tight text-foreground">
            Onboard contractors in minutes, deploy crews in seconds.
          </h1>
        </div>
        <p className="text-base text-muted-foreground">
          Centralize sourcing, onboarding, and payouts across every site. Build once, scale to every project.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          {highlights.map(({ Icon, title, desc }) => (
            <div key={title} className="rounded-3xl border border-border/60 bg-background/70 p-5">
              <Icon className="h-6 w-6 text-primary" />
              <p className="mt-3 text-sm font-semibold">{title}</p>
              <p className="text-sm text-muted-foreground">{desc}</p>
            </div>
          ))}
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          {stats.map((item) => (
            <div key={item.label} className="rounded-3xl border border-border/40 bg-background/60 p-4 text-center">
              <p className="text-3xl font-semibold text-primary">{item.value}</p>
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{item.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
