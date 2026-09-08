import type { Metadata } from "next";
import { headers } from "next/headers";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host");
  const protocol = requestHeaders.get("x-forwarded-proto") ?? "https";
  const metadataBase = new URL(host ? `${protocol}://${host}` : "http://localhost:3000");

  return {
    metadataBase,
    title: "Demo Workflow OS",
    description:
      "A bilingual, categorized map of Demo User's one-person-company workflows, automations and underlying skills.",
    openGraph: {
      title: "Demo Workflow OS",
      description: "Explore PR, HR, IT, Admin and Everyday Wonder Lab workflows step by step.",
      images: [{ alt: "Demo Workflow OS — five company functions mapped step by step", url: "/og-v4.png" }],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: "Demo Workflow OS",
      description: "PR, HR, IT, Admin and Everyday Wonder Lab workflows mapped step by step.",
      images: ["/og-v4.png"],
    },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-HK">
      <body>{children}</body>
    </html>
  );
}
