import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Business Calls AI Agent",
  description: "AI-powered business calls management system",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
