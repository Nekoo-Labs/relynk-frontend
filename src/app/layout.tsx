import type { Metadata } from "next";
// import { Space_Grotesk } from "next/font/google";
import "./globals.css";
import { Web3Provider } from "./provider";
import { Toaster } from "@/components/ui/sonner";
import { cookieToInitialState } from "wagmi";
import { getConfig } from "@/lib/wagmi-config";
import { headers } from "next/headers";

// Temporarily disabled due to network issues during build
// const spaceGrotesk = Space_Grotesk({
//   variable: "--font-space-grotesk",
//   subsets: ["latin"],
//   weight: ["400", "500", "600", "700"],
// });

export const metadata: Metadata = {
  title: "Relynk",
  description: "Create. Share. Get Paid",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const initialState = cookieToInitialState(
    getConfig(),
    (await headers()).get("cookie")
  );
  return (
    <html lang="en">
      <body className="antialiased font-sans">
        <Web3Provider initialState={initialState}>{children}</Web3Provider>
        <Toaster />
      </body>
    </html>
  );
}
