// app/layout.tsx
import "./globals.css";
import { Montserrat } from "next/font/google";
import { Toaster } from "react-hot-toast";

const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});


export const metadata = {
  title: "SabiWay",
  description: "Find trusted service providers near you in Nigeria",
  openGraph: {
    title: "SabiWay",
    description: "Find trusted service providers near you in Nigeria",
    url: "https://www.sabiway.com",
    siteName: "SabiWay",
    images: [
      {
        url: "https://res.cloudinary.com/dk6ew5ikb/image/upload/v1764564358/Group_3_2_1_tg69iu_rj7pko.png", // MUST be full URL
        width: 1200,
        height: 630,
        alt: "SabiWay Preview Image",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "SabiWay",
    description: "Find trusted service providers near you in Nigeria",
    images: ["https://res.cloudinary.com/dk6ew5ikb/image/upload/v1764564358/Group_3_2_1_tg69iu_rj7pko.png"],
  },
};


export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={montserrat.className}>
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
