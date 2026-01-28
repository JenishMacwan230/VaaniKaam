export default function AboutUsPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      {/* ================= HERO ================= */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[var(--brand-gradient)] opacity-15 blur-3xl" />
        <div className="relative container mx-auto px-6 py-24 text-center">
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">
            About <span className="text-primary">Vaani</span>
            <span className="text-secondary inline-block ml-1 -skew-x-6">
              Kaam
            </span>
          </h1>
          <p className="mt-6 max-w-3xl mx-auto text-lg text-muted-foreground">
            VaaniKaam is a voice-powered platform designed to connect workers and
            employers seamlessly, breaking literacy and language barriers
            through technology.
          </p>
        </div>
      </section>

      {/* ================= MISSION ================= */}
      <section className="container mx-auto px-6 py-20">
        <div className="grid gap-12 md:grid-cols-2 items-center">
          <div>
            <h2 className="text-3xl font-semibold mb-4">
              Our <span className="text-primary">Mission</span>
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              Millions of skilled workers struggle to find consistent work due
              to language, literacy, and access barriers. Our mission is to
              empower them using voice-first technology, making job discovery
              as simple as speaking.
            </p>
          </div>

          <div className="rounded-2xl border bg-card p-8 shadow-sm">
            <ul className="space-y-4">
              <li className="flex gap-3">
                <span className="h-2 w-2 mt-2 rounded-full bg-primary" />
                <span>Voice-based job search & hiring</span>
              </li>
              <li className="flex gap-3">
                <span className="h-2 w-2 mt-2 rounded-full bg-secondary" />
                <span>Inclusive access for all skill levels</span>
              </li>
              <li className="flex gap-3">
                <span className="h-2 w-2 mt-2 rounded-full bg-primary" />
                <span>Fast, transparent, and trusted connections</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* ================= WHY VAANIKAAM ================= */}
      <section className="bg-muted">
        <div className="container mx-auto px-6 py-20">
          <h2 className="text-3xl font-semibold text-center mb-12">
            Why <span className="text-primary">Vaani</span>
            <span className="text-secondary inline-block ml-1 -skew-x-6">
              Kaam
            </span>
            ?
          </h2>

          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                title: "Voice First",
                desc: "No typing, no reading. Just speak and get work.",
              },
              {
                title: "Built for India",
                desc: "Multi-language support designed for real users.",
              },
              {
                title: "Trusted Network",
                desc: "Verified workers and employers for safety.",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="rounded-xl border bg-card p-6 shadow-sm hover:shadow-md transition"
              >
                <h3 className="text-xl font-semibold mb-2 text-primary">
                  {item.title}
                </h3>
                <p className="text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================= VISION ================= */}
      <section className="container mx-auto px-6 py-20 text-center">
        <h2 className="text-3xl font-semibold mb-6">
          Our <span className="text-primary">Vision</span>
        </h2>
        <p className="max-w-3xl mx-auto text-muted-foreground text-lg">
          To create a future where finding work is effortless, dignified, and
          accessible to everyone — powered by voice, trust, and technology.
        </p>
      </section>
    </main>
  );
}
