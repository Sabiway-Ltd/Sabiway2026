"use client";  
import Image from "next/image";
import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-[#008753] text-white py-12 px-8 md:px-16 w-full">
      <div className="max-w-[2000px] mx-auto text-left">

        {/* Navigation Links */}
        <div className="flex flex-col gap-6">
          <div className="flex flex-col md:flex-row flex-wrap justify-between gap-x-8 gap-y-5 text-sm font-medium">

            <Link href="/">Home</Link>
            <Link href="/#about_us">About Us</Link>
            <Link href="/#faqs_section">FAQ</Link>

            {/* ⭐ Help Center link works */}
            <Link href="/helpcenter">Help Center</Link>

            <Link href="/privacy-policy">Privacy Policy</Link>
            <Link href="/terms-of-use">Terms of Use</Link>

            <Link href="https://www.instagram.com/sabiway_?igsh=eTJnODVtNTBwdjVx" target="_blank">Instagram</Link>
            <Link href="https://www.facebook.com/share/1AJYz8k3R7/">Facebook</Link>
            <Link href="https://www.linkedin.com/company/sabiway/" target="_blank">Linkedin</Link>

          </div>
        </div>

        <div className="border-t border-white/20 my-8"></div>

        <p className="text-sm leading-relaxed mb-12">
          © 2025 SabiWay. All Rights Reserved. <br />
          Built for communities, powered by trust.
        </p>

        <div className="w-full flex justify-start mt-6">
          <img
            src="https://res.cloudinary.com/dk6ew5ikb/image/upload/v1764564449/Group_3_2_wcvmst_ypr9e0.svg"
            alt="SabiWay Footer Logo"
            width={3800}
            height={1200}
            className="w-full max-w-[1900px] h-auto"
          />
        </div>
      </div>
    </footer>
  );
}
