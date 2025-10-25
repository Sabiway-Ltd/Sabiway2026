"use client";
import Image from "next/image";

export default function Footer() {
  return (
    <footer className="bg-[#008753] text-white py-12 px-8 md:px-16 w-full">
      <div className="max-w-[2000px] mx-auto text-left">
        {/* Navigation Links */}
        <div className="flex flex-col gap-6">
          <div className="flex flex-wrap justify-between gap-x-8 gap-y-3 text-sm font-medium">
            <a href="#">Home</a>
            <a href="#">About Us</a>
            <a href="#">For Clients</a>
            <a href="#">For Service Providers</a>
            <a href="#">FAQ</a>
            <a href="#">Contact Us</a>
            <a href="#">Help Center</a>
            <a href="#">Privacy Policy</a>
            <a href="#">Terms of Service</a>
          </div>

          <div className="flex flex-wrap justify-start gap-x-10 gap-y-3 text-sm font-medium">
            <a href="#">Instagram</a>
            <a href="#">Facebook</a>
            <a href="#">Report a Problem</a>
          </div>
        </div>

        <div className="border-t border-white/20 my-8"></div>

        <p className="text-sm leading-relaxed mb-12">
          © 2025 SabiWay. All Rights Reserved. <br />
          Built for communities, powered by trust.
        </p>

        <div className="w-full flex justify-start mt-6">
          <img
            src="https://res.cloudinary.com/devqbjptr/image/upload/v1761379748/Group_3_2_wcvmst.svg"
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
