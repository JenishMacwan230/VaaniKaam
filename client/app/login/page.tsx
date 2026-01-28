import EngagementPanel from "@/components/EngagementPanel";
import LoginCard from "@/components/LoginCard";

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-background text-foreground px-4 py-25">
      <div className="mx-auto grid w-full max-w-5xl gap-8 lg:items-stretch lg:grid-cols-[1.1fr_0.9fr]">
        <div className="order-2 lg:order-1 flex items-center">
          <EngagementPanel />
        </div>
        <div className="order-1 lg:order-2">
          <LoginCard />
        </div>
      </div>
    </div>
  );
}
