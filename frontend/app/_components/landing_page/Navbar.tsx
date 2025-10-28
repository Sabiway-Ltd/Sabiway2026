"use client";
import Image from "next/image";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { useRouter } from "next/navigation";
import ProfileDropdown from "../profile/ProfileDropdown";
import { useAuthStore } from "@/app/store/useAuthStore";
import Cookies from "js-cookie";

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const router = useRouter();
  const token = Cookies.get("access");
  

  return (
    <nav className="fixed top-0 left-0 w-full z-50 bg-gray-50  ">
      {/* WHITE BACKGROUND RECTANGLE */}
      <div className="absolute top-0 left-0 w-full h-full bg-gray-50 "></div>
      
      {/* ROUNDED LIGHT GREEN NAVBAR */}
      <div className="relative mx-4 md:mx-8 mt-6 flex items-center justify-between bg-[#F5FAF8] rounded-full shadow-sm py-3 px-5 sm:px-8">
        
        {/* LOGO */}
        <div className="flex-shrink-0 cursor-pointer" onClick={() => router.push("/")}>
          <img
            src="https://res.cloudinary.com/devqbjptr/image/upload/v1761378056/Group_3_2_1_tg69iu.png"
            alt="SabiWay Logo"
            width={130}
            height={45}
          />
        </div>

        {/* CENTER NAV LINKS (Desktop Only) */}
        <ul className="hidden md:flex space-x-12 text-gray-800 font-medium">
          <li><a href="/community" className="hover:text-[#008753] transition">Community</a></li>
          <li><a href="#" className="hover:text-[#008753] transition">About Us</a></li>
          <li><a href="#" className="hover:text-[#008753] transition">Reviews</a></li>
          <li><a href="#" className="hover:text-[#008753] transition">FAQs</a></li>
        </ul>

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
          <ul className="flex flex-col text-gray-800 font-medium text-center py-5 space-y-4">
            <li><a href="#" className="hover:text-[#008753] transition">Community</a></li>
            <li><a href="#" className="hover:text-[#008753] transition">About Us</a></li>
            <li><a href="#" className="hover:text-[#008753] transition">Reviews</a></li>
            <li><a href="#" className="hover:text-[#008753] transition">FAQs</a></li>
          </ul>
          <div className="flex flex-col items-center space-y-3 pb-6">
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