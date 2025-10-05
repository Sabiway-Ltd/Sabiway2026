"use client";
import Image from "next/image";
import { useState } from "react";
import { Menu, X } from "lucide-react";

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (

    <nav className="fixed top-0 left-0 w-full z-50 bg-white/80 backdrop-blur-md " >
      <div 
            className="flex items-center justify-between max-w-[1400px] mx-5  bg-[#F5FAF8] rounded-full shadow-sm py-3 px-5 sm:px-8 mt-2">
        {/* LOGO */}
        <div className="flex-shrink-0">
          <Image
            src="/sabiwaylogo.svg"
            alt="SabiWay Logo"
            width={130}
            height={45}
            priority
          />
        </div>

        {/* CENTER NAV LINKS (Desktop Only) */}
        <ul className="hidden md:flex space-x-12 text-gray-800 font-medium">
          <li><a href="#" className="hover:text-[#008753] transition">Community</a></li>
          <li><a href="#" className="hover:text-[#008753] transition">About Us</a></li>
          <li><a href="#" className="hover:text-[#008753] transition">Reviews</a></li>
          <li><a href="#" className="hover:text-[#008753] transition">FAQs</a></li>
        </ul>

        {/* RIGHT BUTTONS (Desktop) */}
        <div className="hidden md:flex items-center space-x-4">
          <button className="text-gray-700 font-medium hover:text-[#008753] transition">Login</button>
          <button className="px-6 py-2 bg-[#008753] text-white rounded-full font-semibold hover:bg-[#006B42] transition">
            Sign Up
          </button>
        </div>

        {/* MOBILE MENU TOGGLE */}
        <button
          className="md:hidden text-gray-800"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          {menuOpen ? <X size={26} /> : <Menu size={26} />}
        </button>
      </div>

      {/* MOBILE DROPDOWN MENU */}
      {menuOpen && (
        <div className="md:hidden absolute top-[82px] left-0 w-full bg-white border-t border-gray-200 shadow-lg animate-fadeIn">
          <ul className="flex flex-col text-gray-800 font-medium text-center py-5 space-y-4">
            <li><a href="#" className="hover:text-[#008753] transition">Community</a></li>
            <li><a href="#" className="hover:text-[#008753] transition">About Us</a></li>
            <li><a href="#" className="hover:text-[#008753] transition">Reviews</a></li>
            <li><a href="#" className="hover:text-[#008753] transition">FAQs</a></li>
          </ul>
          <div className="flex flex-col items-center space-y-3 pb-6">
            <button className="text-gray-700 font-medium hover:text-[#008753] transition">Login</button>
            <button className="px-6 py-2 bg-[#008753] text-white rounded-full font-semibold hover:bg-[#006B42] transition">
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
