// app/community/page.tsx
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "SabiForum – SabiWay Community",
  description:
    "Join SabiForum, the SabiWay community where Nigerians at home and in the diaspora connect, ask questions, share experiences, and get local recommendations.",
  keywords: [
    "SabiForum",
    "SabiWay community",
    "Nigeria forum",
    "Nigerian diaspora community",
    "local services discussion Nigeria",
    "SabiWay forum",
  ],
  openGraph: {
    title: "SabiForum – SabiWay Community",
    description:
      "Connect with Nigerians worldwide on SabiForum. Ask questions, share tips, and discuss trusted local services.",
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
      "SabiForum is SabiWay’s community for Nigerians at home and abroad.",
    images: ["https://www.sabiway.com/android-chrome-512x512.png"],
  },
};
