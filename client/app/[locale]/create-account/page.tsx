"use client";

import { useState } from "react";
import PhoneAuthCard from "@/components/PhoneAuthCard";

export default function CreateAccountPage() {
  const [currentStep, setCurrentStep] = useState<"phone" | "otp" | "details">("phone");

  return (
    <div className="w-full max-w-xl">
      <PhoneAuthCard onStepChange={setCurrentStep} />
    </div>
  );
}
