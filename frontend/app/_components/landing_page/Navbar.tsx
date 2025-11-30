"use client";
import Image from "next/image";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { useRouter } from "next/navigation";
import ProfileDropdown from "../profile/ProfileDropdown";
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

    setMenuOpen(false);
  };

  return (
    <nav className="fixed top-0 left-0 w-full z-50 bg-white">
      
      {/* Background FIX */}
      <div className="absolute inset-0 bg-white -z-10"></div>

      {/* MAIN NAVBAR */}
      <div className="relative mx-4 md:mx-8 mt-6 flex items-center justify-between bg-[#008753]/5 rounded-full shadow-sm md:py-3 py-2 px-5 sm:px-8">

        {/* LOGO */}
        <Link href="/" className="flex-shrink-0 cursor-pointer">
          <img
            src="https://res.cloudinary.com/devqbjptr/image/upload/v1761378056/Group_3_2_1_tg69iu.png"
            alt="SabiWay Logo"
            className="w-24 md:w-32 h-auto hover:opacity-90 transition"
          />
        </Link>

        {/* DESKTOP NAV LINKS */}
        <div className="hidden md:flex space-x-12 text-gray-800 font-medium">

          <Link href="/community" className="hover:text-[#008753] transition">
            Community
          </Link>

          <a
            href="/#about_us"
            className="hover:text-[#008753] transition"
          >
            About Us
          </a>

          <a
            href="/#review_section"
            onClick={() => goToSection("review_section")}
            className="hover:text-[#008753] transition"
          >
            Reviews
          </a>

          <a
            href="/#faqs_section"
            className="hover:text-[#008753] transition"
          >
            FAQs
          </a>

        </div>

        {/* RIGHT SIDE (LOGIN / PROFILE) */}
        <div className="flex items-center space-x-4">
          {!token && (
            <div className="flex gap-6">
              {/* Mobile Login */}
              <button
                onClick={() => router.push("/login")}
                className="px-5 py-1.5 md:hidden bg-[#008753] text-white rounded-lg text-sm font-semibold hover:bg-[#006B42] transition"
              >
                Login
              </button>

              {/* Desktop Login */}
              <button
                onClick={() => router.push("/login")}
                className="px-6 py-2 hidden md:block bg-[#008753] text-white rounded-lg font-semibold hover:bg-[#006B42] transition"
              >
                Login
              </button>
            </div>
          )}

          {token && (
            <ProfileDropdown />
          )}
        </div>

        {/* MOBILE MENU TOGGLE */}
        {!token && (
          <button
            className="md:hidden text-gray-800"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
          >
            {menuOpen ? <X size={26} /> : <Menu size={26} />}
          </button>
        )}
      </div>

      {/* MOBILE MENU */}
      {menuOpen && (
        <div className="md:hidden absolute top-full left-0 w-full bg-white border-t border-gray-200 shadow-lg animate-fadeIn">
          <div className="flex flex-col text-gray-800 font-medium text-center py-5 space-y-4">

            <Link
              href="/community"
              onClick={() => setMenuOpen(false)}
              className="hover:text-[#008753] transition"
            >
              Community
            </Link>

            <a
              href="/#about_us"
              onClick={() => goToSection("about_us")}
              className="hover:text-[#008753] transition"
            >
              About Us
            </a>

            <a
              href="/#review_section"
              onClick={() => goToSection("review_section")}
              className="hover:text-[#008753] transition"
            >
              Reviews
            </a>

            <a
              href="/#faqs_section"
              onClick={() => goToSection("faqs_section")}
              className="hover:text-[#008753] transition"
            >
              FAQs
            </a>

          </div>

          {/* MOBILE LOGIN/SIGNUP */}
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

      {/* Animations */}
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
