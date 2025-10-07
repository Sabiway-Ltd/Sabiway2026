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
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${montserrat.className}`}>{children}</body>
      <Toaster
          position="top-right"
          toastOptions={{
            success: {
              style: {
                background: "#008753",
                color: "#fff",
              },
            },
            error: {
              style: {
                background: "#ef4444",
                color: "#fff",
              },
            },
          }}
        />
    </html>
  );
}
