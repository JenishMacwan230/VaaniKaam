"use client";

import { useState, Suspense } from "react";
import PhoneAuthCard from "@/components/PhoneAuthCard";

export default function CreateAccountPage() {
  const [currentStep, setCurrentStep] = useState<"phone" | "otp" | "details">("phone");

  return (
    <div className="w-full max-w-xl">
      <Suspense fallback={<div className="flex justify-center p-8"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>}>
        <PhoneAuthCard onStepChange={setCurrentStep} />
      </Suspense>
    </div>
  );
}
