"use client";

import { useState } from "react";
import ShowcasePanel from "@/components/ShowcasePanel";
import PhoneAuthCard from "@/components/PhoneAuthCard";

export default function CreateAccountPage() {
  const [currentStep, setCurrentStep] = useState<"phone" | "otp" | "details">("phone");

  return (
    <div className="min-h-screen bg-background text-foreground px-4 py-16">
      <div className="mx-auto grid w-full max-w-6xl gap-10 lg:items-stretch lg:grid-cols-[1.05fr_0.95fr]">
        {currentStep !== "details" && (
          <div className="order-2 lg:order-1">
            <ShowcasePanel />
          </div>
        )}
        <div className={`order-1 ${currentStep !== "details" ? "lg:order-2" : "lg:col-span-2 lg:mx-auto lg:max-w-xl"}`}>
          <PhoneAuthCard onStepChange={setCurrentStep} />
        </div>
      </div>
    </div>
  );
}
