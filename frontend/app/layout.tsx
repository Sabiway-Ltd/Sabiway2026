import type { Metadata } from "next";
import "./globals.css";
import { Inter } from "next/font/google";
import { Toaster } from "react-hot-toast";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/android-chrome-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/android-chrome-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },
  title: {
    default: "SabiWay – Trusted Services, Jobs and Community",
    template: "%s | SabiWay",
  },
  description:
    "SabiWay is a Nigerian-led marketplace and community helping people discover trusted professionals, post jobs and connect through SabiForum.",
  keywords: [
    "SabiWay",
    "SabiForum",
    "Nigerian service marketplace",
    "trusted professionals Nigeria",
    "post jobs Nigeria",
    "local services Nigeria",
    "diaspora services Nigeria",
  ],
  openGraph: {
    title: "SabiWay – Trusted Services, Jobs and Community",
    description: "Find trusted Nigerian professionals, post jobs and connect through SabiForum.",
    url: "https://www.sabiway.com",
    siteName: "SabiWay",
    images: [{ url: "https://www.sabiway.com/android-chrome-512x512.png", width: 1200, height: 630, alt: "SabiWay" }],
    locale: "en_NG",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "SabiWay – Trusted Services, Jobs and Community",
    description: "Find trusted Nigerian professionals, post jobs and connect through SabiForum.",
    images: ["https://www.sabiway.com/android-chrome-512x512.png"],
    creator: "@sabiway",
  },
};

export const viewport = { width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Organization",
            name: "SabiWay",
            url: "https://www.sabiway.com",
            logo: "https://www.sabiway.com/android-chrome-512x512.png",
            description: "SabiWay is a Nigerian-led marketplace and community for trusted services, jobs and local connections.",
            sameAs: ["https://x.com/sabiway", "https://www.instagram.com/sabiway", "https://www.linkedin.com/company/sabiway"],
          }),
        }}
      />
      <body className={`${inter.variable} antialiased`}>
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4500,
            style: {
              background: "var(--sabi-surface)",
              color: "var(--sabi-text)",
              border: "1px solid var(--sabi-border)",
            },
            success: { iconTheme: { primary: "var(--sabi-success)", secondary: "var(--sabi-on-primary)" } },
            error: { iconTheme: { primary: "var(--sabi-danger)", secondary: "#FFFFFF" } },
          }}
        />
      </body>
    </html>
  );
}
