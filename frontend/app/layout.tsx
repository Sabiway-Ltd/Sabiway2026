import type { Metadata } from "next";
import "./globals.css";
import { Inter } from "next/font/google";
import { Toaster } from "react-hot-toast";
import { ProductAnalytics } from "./_components/ProductAnalytics";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });

export const metadata: Metadata = {
  icons: { icon: [{ url: "/favicon.ico" },{ url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },{ url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },{ url: "/android-chrome-192x192.png", sizes: "192x192", type: "image/png" },{ url: "/android-chrome-512x512.png", sizes: "512x512", type: "image/png" }], apple: "/apple-touch-icon.png" },
  title: { default: "SabiWay – Connecting Nigeria and the Diaspora", template: "%s | SabiWay" },
  description: "SabiWay connects people in Nigeria with Nigerians across the diaspora around trusted services, professional opportunity and community.",
  keywords: ["SabiWay","SabiForum","Nigeria diaspora services","Nigerian professionals","trusted services Nigeria","diaspora Nigeria marketplace","professional opportunities Nigeria","Nigerian community platform"],
  openGraph: { title:"SabiWay – Connecting Nigeria and the Diaspora", description:"Discover trusted services, professional opportunity and community connecting Nigeria with Nigerians around the world.", url:"https://www.sabiway.com", siteName:"SabiWay", images:[{url:"https://www.sabiway.com/android-chrome-512x512.png",width:1200,height:630,alt:"SabiWay"}], locale:"en_NG", type:"website" },
  twitter: { card:"summary_large_image", title:"SabiWay – Connecting Nigeria and the Diaspora", description:"Trusted services, professional opportunity and community connecting Nigeria with Nigerians around the world.", images:["https://www.sabiway.com/android-chrome-512x512.png"], creator:"@sabiway" },
};

export const viewport = { width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ "@context":"https://schema.org","@type":"Organization",name:"SabiWay",url:"https://www.sabiway.com",logo:"https://www.sabiway.com/android-chrome-512x512.png",description:"SabiWay connects Nigeria and the Nigerian diaspora around trusted services, professional opportunity and community.",sameAs:["https://x.com/sabiway","https://www.instagram.com/sabiway","https://www.linkedin.com/company/sabiway"] }) }} />
      <body className={`${inter.variable} antialiased`}>
        <ProductAnalytics />
        {children}
        <Toaster position="top-right" toastOptions={{duration:4500,style:{background:"var(--sabi-surface)",color:"var(--sabi-text)",border:"1px solid var(--sabi-border)"},success:{iconTheme:{primary:"var(--sabi-success)",secondary:"var(--sabi-on-primary)"}},error:{iconTheme:{primary:"var(--sabi-danger)",secondary:"#FFFFFF"}}}} />
      </body>
    </html>
  );
}
