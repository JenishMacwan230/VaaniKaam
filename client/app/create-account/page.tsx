import ShowcasePanel from "@/components/ShowcasePanel";
import SignupCard from "@/components/SignupCard";

export default function CreateAccountPage() {
  return (
    <div className="min-h-screen bg-background text-foreground px-4 py-16">
      <div className="mx-auto grid w-full max-w-6xl gap-10 lg:items-stretch lg:grid-cols-[1.05fr_0.95fr]">
        <div className="order-2 lg:order-1">
          <ShowcasePanel />
        </div>
        <div className="order-1 lg:order-2">
          <SignupCard />
        </div>
      </div>
    </div>
  );
}
