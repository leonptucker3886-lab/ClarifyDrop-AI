import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ClarityDrop AI - Stop the rewrite. See the facts.",
  description: "Drop your side. Get the exact discrepancies and what to do next.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">

      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
