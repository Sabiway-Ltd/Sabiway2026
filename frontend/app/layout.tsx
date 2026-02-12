// app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";
import { Montserrat } from "next/font/google";
import { Toaster } from "react-hot-toast";

const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-montserrat",
});

export const metadata: Metadata = {
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },
  title: {
    default: "SabiWay – Trusted Local Services in Nigeria",
    template: "%s | SabiWay",
  },
  description:
    "SabiWay is a people-powered service marketplace helping Nigerians at home and in the diaspora book verified local professionals with confidence.",
  keywords: [
    "SabiWay",
    "Nigerian service marketplace",
    "trusted artisans in Nigeria",
    "book services in Nigeria",
    "Nigerian plumbers",
    "electricians in Nigeria",
    "cleaners in Nigeria",
    "handyman Nigeria",
    "local services Nigeria",
    "diaspora services Nigeria",
  ],
  openGraph: {
    title: "SabiWay – Trusted Local Services in Nigeria",
    description:
      "Book verified Nigerian service providers with confidence. From barbers to plumbers, SabiWay connects you to trusted local professionals—wherever you are.",
    url: "https://www.sabiway.com",
    siteName: "SabiWay",
    images: [
      {
        url: "https://www.sabiway.com/android-chrome-512x512.png",
        width: 1200,
        height: 630,
        alt: "SabiWay – Trusted Nigerian Service Providers",
      },
    ],
    locale: "en_NG",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "SabiWay – Trusted Local Services in Nigeria",
    description:
      "Find and book verified Nigerian service providers with confidence. Built for Nigerians at home and abroad.",
    images: [
      "https://www.sabiway.com/android-chrome-512x512.png",
    ],
    creator: "@sabiway",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      {/* JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Organization",
            name: "SabiWay",
            url: "https://www.sabiway.com",
            logo:
              "https://www.sabiway.com/android-chrome-512x512.png",
            description:
              "SabiWay is a Nigerian-led service marketplace connecting customers with verified local professionals across Nigeria.",
            sameAs: [
              "https://x.com/sabiway",
              "https://www.instagram.com/sabiway",
              "https://www.linkedin.com/company/sabiway",
            ],
          }),
        }}
      />

      <body className={`${montserrat.variable} antialiased`}>
        {children}

        <Toaster
          position="top-right"
          toastOptions={{
            success: { style: { background: "#008753", color: "#fff" } },
            error: { style: { background: "#ef4444", color: "#fff" } },
          }}
        />
      </body>
    </html>
  );
}
