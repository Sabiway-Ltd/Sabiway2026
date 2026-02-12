// app/community/layout.tsx
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    default: "SabiForum – SabiWay Community",
    template: "%s | SabiForum",
  },
  description:
    "Join SabiForum, the SabiWay community where Nigerians at home and in the diaspora connect, ask questions, share experiences, and get local recommendations.",
  keywords: [
    "SabiForum",
    "SabiWay community",
    "Nigeria forum",
    "Nigerian diaspora community",
    "trusted services discussion Nigeria",
    "local recommendations Nigeria",
  ],
  openGraph: {
    title: "SabiForum – SabiWay Community",
    description:
      "SabiForum is the community space for SabiWay users to connect, ask questions, and share experiences across Nigeria and the diaspora.",
    url: "https://www.sabiway.com/community",
    siteName: "SabiForum",
    images: [
      {
        url: "https://www.sabiway.com/android-chrome-512x512.png",
        width: 1200,
        height: 630,
        alt: "SabiForum – SabiWay Community",
      },
    ],
    locale: "en_NG",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "SabiForum – SabiWay Community",
    description:
      "SabiForum is the SabiWay community for Nigerians at home and abroad to connect and share local insights.",
    images: ["https://www.sabiway.com/android-chrome-512x512.png"],
    creator: "@sabiway",
  },
};

export default function CommunityLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {/* JSON-LD Structured Data for SabiForum */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebSite",
            name: "SabiForum",
            url: "https://www.sabiway.com/community",
            description:
              "SabiForum is the SabiWay community where Nigerians connect, ask questions, and share local experiences.",
            isPartOf: {
              "@type": "Organization",
              name: "SabiWay",
              url: "https://www.sabiway.com",
            },
            inLanguage: "en-NG",
          }),
        }}
      />

      {children}
    </>
  );
}
