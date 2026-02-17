"use client";
import React from "react";
import { useTranslations } from "next-intl";
import { Separator } from "@/components/ui/separator";

const ArrowRightIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M17 8l4 4m0 0l-4 4m4-4H3"
    />
  </svg>
);

const CheckIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M5 13l4 4L19 7"
    />
  </svg>
);

const Hero3: React.FC = () => {
  const t = useTranslations("hero");
  
  const features = [
    t("feature1"),
    t("feature2"),
    t("feature3"),
  ];

  return (
    <div className="bg-white dark:bg-black w-full">
      <Separator />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <main className="py-20 lg:py-32">
          <div className="text-center">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-black dark:text-white leading-tight">
              {t("title")}
              <br />
              <span className="text-gray-600 dark:text-gray-400">
                {t("subtitle")}
              </span>
            </h1>

            <p className="mt-6 text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
              {t("description")}
            </p>

            <div className="mt-8 flex flex-wrap justify-center gap-6">
              {features.map((feature, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 text-gray-600 dark:text-gray-400"
                >
                  <CheckIcon className="h-5 w-5 text-black dark:text-white" />
                  <span>{feature}</span>
                </div>
              ))}
            </div>

            <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
              <button className="bg-black dark:bg-white text-white dark:text-black px-8 py-4 rounded-md font-semibold hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors flex items-center justify-center gap-2">
                {t("cta1")}
                <ArrowRightIcon className="h-5 w-5" />
              </button>
              <button className="border-2 border-black dark:border-white text-black dark:text-white px-8 py-4 rounded-md font-semibold hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-colors">
                {t("cta2")}
              </button>
            </div>

            <div className="mt-16 pt-16 border-t border-gray-200 dark:border-gray-800">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="text-center">
                  <div className="text-3xl font-bold text-black dark:text-white">
                    10K+
                  </div>
                  <div className="text-gray-600 dark:text-gray-400">
                    {t("users")}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-black dark:text-white">
                    500+
                  </div>
                  <div className="text-gray-600 dark:text-gray-400">
                    {t("companies")}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-black dark:text-white">
                    4.9/5
                  </div>
                  <div className="text-gray-600 dark:text-gray-400">
                    {t("ratings")}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
      <Separator />
    </div>
  );
};

export default Hero3;
