import type { Metadata } from "next";
import { Manrope, Hind_Siliguri } from "next/font/google";
import { PhoneFrame } from "@/components/layout/PhoneFrame";
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
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${manrope.variable} ${hindSiliguri.variable}`}>
      <body className="font-en antialiased">
        <PhoneFrame>{children}</PhoneFrame>
      </body>
    </html>
  );
}
