import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SharkFest 2028",
  description: "Three days, two stages, one pack of sharks. The festival site for SharkFest 2028.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
