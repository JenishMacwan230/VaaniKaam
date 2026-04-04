'use client';

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTranslations } from "next-intl";
import { getCurrentLocale } from "@/lib/authClient";
import { AlertCircle, CheckCircle } from "lucide-react";

interface WorkForm {
  title: string;
  description: string;
  category: string;
  payType: "hour" | "day" | "job";
  payAmount: string;
  location: string;
  urgency: "Immediate" | "Today" | "Flexible";
}

export default function AddWorksPage() {
  const pathname = usePathname();
  const locale = getCurrentLocale(pathname);
  const router = useRouter();
  const t = useTranslations();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState<WorkForm>({
    title: "",
    description: "",
    category: "",
    payType: "day",
    payAmount: "",
    location: "",
    urgency: "Flexible",
  });

  const categories = [
    "Construction",
    "Plumbing",
    "Electrical",
    "Carpentry",
    "Painting",
    "Cleaning",
    "Gardening",
    "Tutoring",
    "Other",
  ];

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      // Validate form
      if (!formData.title || !formData.category || !formData.payAmount || !formData.location) {
        setError("Please fill in all required fields");
        setIsLoading(false);
        return;
      }

      const payload = {
        title: formData.title,
        description: formData.description,
        category: formData.category,
        pricingType: formData.payType,
        pricingAmount: parseFloat(formData.payAmount),
        location: formData.location,
        urgency: formData.urgency,
      };

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/jobs`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        const data = await response.json();
        setError(data.message || "Failed to create work");
        setIsLoading(false);
        return;
      }

      setSuccess(true);
      setFormData({
        title: "",
        description: "",
        category: "",
        payType: "day",
        payAmount: "",
        location: "",
        urgency: "Flexible",
      });

      // Redirect after 2 seconds
      setTimeout(() => {
        router.push(`/${locale}/dashboard/contractor`);
      }, 2000);
    } catch (err) {
      setError("An error occurred. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Post a New Work Opportunity
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Fill in the details below to create a work posting
          </p>
        </div>

        <Card className="border border-gray-200 dark:border-gray-800">
          <CardHeader>
            <CardTitle>Work Details</CardTitle>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex gap-2">
                <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              </div>
            )}

            {success && (
              <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg flex gap-2">
                <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-green-600 dark:text-green-400">
                  Work posted successfully! Redirecting...
                </p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Title */}
              <div>
                <Label htmlFor="title" className="text-base font-medium">
                  Work Title *
                </Label>
                <Input
                  id="title"
                  name="title"
                  type="text"
                  placeholder="e.g., Plumber needed for apartment repair"
                  value={formData.title}
                  onChange={handleChange}
                  className="mt-2"
                />
              </div>

              {/* Description */}
              <div>
                <Label htmlFor="description" className="text-base font-medium">
                  Description
                </Label>
                <Textarea
                  id="description"
                  name="description"
                  placeholder="Provide details about the work (optional)"
                  value={formData.description}
                  onChange={handleChange}
                  rows={4}
                  className="mt-2"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Category */}
                <div>
                  <Label htmlFor="category" className="text-base font-medium">
                    Category *
                  </Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) =>
                      handleSelectChange("category", value)
                    }
                  >
                    <SelectTrigger id="category" className="mt-2">
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Location */}
                <div>
                  <Label htmlFor="location" className="text-base font-medium">
                    Location *
                  </Label>
                  <Input
                    id="location"
                    name="location"
                    type="text"
                    placeholder="e.g., Bilimora, Navsari"
                    value={formData.location}
                    onChange={handleChange}
                    className="mt-2"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Pay Type */}
                <div>
                  <Label htmlFor="payType" className="text-base font-medium">
                    Pay Type
                  </Label>
                  <Select
                    value={formData.payType}
                    onValueChange={(value) =>
                      handleSelectChange("payType", value as any)
                    }
                  >
                    <SelectTrigger id="payType" className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hour">Per Hour</SelectItem>
                      <SelectItem value="day">Per Day</SelectItem>
                      <SelectItem value="job">Per Job</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Pay Amount */}
                <div>
                  <Label htmlFor="payAmount" className="text-base font-medium">
                    Pay Amount (₹) *
                  </Label>
                  <Input
                    id="payAmount"
                    name="payAmount"
                    type="number"
                    placeholder="Amount"
                    value={formData.payAmount}
                    onChange={handleChange}
                    className="mt-2"
                  />
                </div>

                {/* Urgency */}
                <div>
                  <Label
                    htmlFor="urgency"
                    className="text-base font-medium"
                  >
                    Urgency
                  </Label>
                  <Select
                    value={formData.urgency}
                    onValueChange={(value) =>
                      handleSelectChange("urgency", value)
                    }
                  >
                    <SelectTrigger id="urgency" className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Immediate">Immediate</SelectItem>
                      <SelectItem value="Today">Today</SelectItem>
                      <SelectItem value="Flexible">Flexible</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Buttons */}
              <div className="flex gap-4 pt-6">
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                >
                  {isLoading ? "Posting..." : "Post Work"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  disabled={isLoading}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
