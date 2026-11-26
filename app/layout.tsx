import type { Metadata } from "next";
import "./globals.css";
import ThemeProvider from "./components/theme-provider";

export const metadata: Metadata = {
  title: "CampusRecover | DIU Lost & Found",
  description:
    "A secure campus lost and found management platform for the DIU community.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}