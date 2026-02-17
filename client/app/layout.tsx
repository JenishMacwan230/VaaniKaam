import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "VaaniKaam",
  description: "Daily wage worker job platform",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
