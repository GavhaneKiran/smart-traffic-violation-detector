import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SVPD | Smart Traffic Violation Pattern Detector",
  description: "AI-powered smart city traffic violation detection and analytics platform",
  icons: { icon: "/favicon.ico" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen" style={{ background: "var(--bg-primary)" }}>
        {/* Global scan line effect */}
        <div className="scan-line" />
        {children}
      </body>
    </html>
  );
}
