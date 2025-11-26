"use client";
import Image from "next/image";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { useRouter } from "next/navigation";
import ProfileDropdown from "../profile/ProfileDropdown";
import { useAuthStore } from "@/app/store/useAuthStore";
import Cookies from "js-cookie";
import { usePathname } from "next/navigation";
import Link from "next/link";


export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const router = useRouter();
  const token = Cookies.get("access");

  const pathname = usePathname();

  const goToSection = async (sectionId) => {
    if (pathname === "/") {
      const el = document.getElementById(sectionId);
      if (el) el.scrollIntoView({ behavior: "smooth" });
    } else {
      router.push(`/#${sectionId}`);
    }

    setMenuOpen(false); // close mobile menu after click
  };

    

  return (
    <nav className="fixed top-0 left-0 w-full z-50 bg-white  ">
      {/* WHITE BACKGROUND RECTANGLE */}
      <div className="absolute top-0 left-0 w-full h-full  bg-white"></div>
      
      {/* ROUNDED LIGHT GREEN NAVBAR */}
      <div className="relative mx-4 md:mx-8 mt-6 flex items-center justify-between bg-[#008753]/5 rounded-full shadow-sm md:py-3 py-2 px-5 sm:px-8">
        
        {/* LOGO */}
        <Link href="/" className="flex-shrink-0 cursor-pointer" >
          <img
              src="https://res.cloudinary.com/devqbjptr/image/upload/v1761378056/Group_3_2_1_tg69iu.png"
              alt="SabiWay Logo"
              className="w-20 md:w-32 h-auto cursor-pointer hover:opacity-90 transition"
            />
        </Link>

        {/* CENTER NAV LINKS (Desktop Only) */}
        <div className="hidden md:flex space-x-12 text-gray-800 font-medium">

          <div>
            <Link href="/community" className="hover:text-[#008753] transition">
              Community
            </Link>
          </div>

          <div>
            <Link href="/#about_us"
              className="cursor-pointer hover:text-[#008753] transition"
            >
              About Us
            </Link>
          </div>

          <div>
            <Link href="/#review_section"
              onClick={() => goToSection("review_section")}
              className="cursor-pointer hover:text-[#008753] transition"
            >
              Reviews
            </Link>
          </div>

          <div>
            <Link href="/#faqs_section"
              className="cursor-pointer hover:text-[#008753] transition"
            >
              FAQs
            </Link>
          </div>
        </div>


        {/* RIGHT BUTTONS (Desktop) */}
        <div className="hidden md:flex items-center space-x-4">
          {
            !token && (
              <div className="flex gap-6">
                <button
                  onClick={() => router.push("/login")}
                  className="text-gray-700 font-medium hover:text-[#008753] transition"
                >
                  Login
                </button>
                <button
                  onClick={() => router.push("/signup")}
                  className="px-6 py-2 bg-[#008753] text-white rounded-full font-semibold hover:bg-[#006B42] transition"
                >
                  Sign Up
                </button>
              </div>
            )
          }
          
        </div>

        {/* MOBILE MENU TOGGLE */}
        {
          !token && (
            <button
              className="md:hidden text-gray-800"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Toggle menu"
            >
              {menuOpen ? <X size={26} /> : <Menu size={26} />}
            </button>
          )
        }

        {
            token && (
              <div>
                <ProfileDropdown/>
              </div>
            )
          }
        
      </div>


      {/* MOBILE DROPDOWN MENU */}
      {menuOpen && (
        <div className="md:hidden absolute top-full left-0 w-full bg-white border-t border-gray-200 shadow-lg animate-fadeIn">
          <div className="flex flex-col text-gray-800 font-medium text-center py-5 space-y-4">

            {/* Community link */}
            <div>
              <Link
                href="/community"
                onClick={() => setMenuOpen(false)}
                className="hover:text-[#008753] transition"
              >
                Community
              </Link>
            </div>

            {/* About Us */}
            <div>
              <Link
                href="/#about_us"
                onClick={() => goToSection("about_us")}
                className="cursor-pointer hover:text-[#008753] transition"
              >
                About Us
              </Link>
            </div>

            {/* Reviews */}
            <div>
              <Link
                href="/#review_section"
                onClick={() => goToSection("review_section")}
                className="cursor-pointer hover:text-[#008753] transition"
              >
                Reviews
              </Link>
            </div>

            {/* FAQs */}
            <div>
              <Link
                href="/#faqs_section"
                onClick={() => goToSection("faqs_section")}
                className="cursor-pointer hover:text-[#008753] transition"
              >
                FAQs
              </Link>
            </div>

          </div>

          {/* Buttons */}
          <div className="flex flex-col items-center space-y-3 pb-6">
            <button
              onClick={() => {
                setMenuOpen(false);
                router.push("/login");
              }}
              className="text-gray-700 font-medium hover:text-[#008753] transition"
            >
              Login
            </button>

            <button
              onClick={() => {
                setMenuOpen(false);
                router.push("/signup");
              }}
              className="px-6 py-2 bg-[#008753] text-white rounded-full font-semibold hover:bg-[#006B42] transition"
            >
              Sign Up
            </button>
          </div>
        </div>
      )}


      {/* Fade animation */}
      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.25s ease-out forwards;
        }
      `}</style>
    </nav>
  );
}