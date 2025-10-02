// app/_components/navbar.tsx

import Image from "next/image"

export default function LandingNavbar(){
    return(
        <nav className="w-full flex justify-center py-6 px-5">
            <div className="bg-[#F5FAF8] rounded-full max-w-[1400px] w-full relative flex items-center py-4 shadow-sm">
                {/* LOGO */}
                <div className="flex-shrink-0 pl-4 md:pl-8">
                <Image
                    src="/sabiwaylogo.svg"
                    alt="SabiWay Logo"
                    width={150}
                    height={50}
                    priority
                />
                </div>

                {/* NAV LINKS */}
                <ul className="hidden md:flex space-x-14 text-gray-800 font-medium absolute left-1/2 transform -translate-x-1/2">
                <li><a href="#">Community</a></li>
                <li><a href="#">About Us</a></li>
                <li><a href="#">Reviews</a></li>
                <li><a href="#">FAQs</a></li>
                </ul>

                {/* LOGIN / SIGNUP */}
                <div className="flex items-center space-x-4 ml-auto pr-4 md:pr-8">
                <button className="text-gray-700 font-medium">Login</button>
                <button className="px-6 py-2 bg-[#008753] text-white rounded-full font-semibold hover:bg-[#006B42] transition">
                    Sign Up
                </button>
                </div>
            </div>
        </nav>
    )
}