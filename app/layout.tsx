import type { Metadata, Viewport } from "next";
import { Manrope, Hind_Siliguri } from "next/font/google";
import { PhoneFrame } from "@/components/layout/PhoneFrame";
import { ServiceWorkerRegistration } from "@/components/pwa/ServiceWorkerRegistration";
import "./globals.css";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
});

const hindSiliguri = Hind_Siliguri({
  variable: "--font-hind-siliguri",
  weight: ["300", "400", "500", "600", "700"],
  subsets: ["bengali", "latin"],
});

export const metadata: Metadata = {
  title: "OnboardingBuddy — PeopleDesk",
  description: "Akij Resource এর নতুন কর্মীদের জন্য গাইডেড ১৮০ দিনের অনবোর্ডিং জার্নি",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "OnboardingBuddy",
  },
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: "/icons/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#2ca24d",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${manrope.variable} ${hindSiliguri.variable}`}>
      <body className="font-en antialiased">
        <ServiceWorkerRegistration />
        <PhoneFrame>{children}</PhoneFrame>
      </body>
    </html>
  );
}
