"use client";
import Image from "next/image";

export default function Serviceprovider() {
  const providers = [
    { name: "Tayo Omotola", role: "Contractor", img: "/1.png", exp: "2 yrs Exp.", location: "Calabar, Lagos" },
    { name: "Chidi Amadi", role: "Writer", img: "/2.png", exp: "2 yrs Exp.", location: "Lagos, Nigeria" },
    { name: "Hally Akpan", role: "House Keeper", img: "/3.png", exp: "2 yrs Exp.", location: "London, UK" },
    { name: "Lola Makinde", role: "Fashion Model", img: "/4.png", exp: "2 yrs Exp.", location: "Rivers, Nigeria" },
    { name: "Chiamaka Amadi", role: "Chef", img: "/5.png", exp: "2 yrs Exp.", location: "Toronto, Canada" },
    { name: "Tayo Omotola", role: "Dispatcher", img: "/6.png", exp: "2 yrs Exp.", location: "Abia, Nigeria" },
    { name: "Tayo Omotola", role: "Errand Boy", img: "/7.png", exp: "2 yrs Exp.", location: "New York, USA" },
    { name: "Tayo Omotola", role: "Freelancer", img: "/8.png", exp: "2 yrs Exp.", location: "Lagos, Nigeria" },
  ];

  return (
    <section className="w-full text-center px-6 md:px-16 py-24">
      <h3 className="text-gray-500 font-medium mb-10">
        Service Providers You Might Like
      </h3>

      {/* GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-10 max-w-6xl mx-auto">
        {providers.map((provider, index) => (
          <div
            key={index}
            className="relative bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-lg transition-all duration-300 border border-gray-200 flex flex-col items-center justify-center"
          >
            {/* Image */}
            <div className="w-full h-[350px] relative">
              <Image
                src={provider.img}
                alt={provider.name}
                fill
                className="object-cover rounded-2xl"
                priority
              />
            </div>

            {/* Overlay Text Centered */}
            <div className="absolute inset-0 bg-black/30 backdrop-blur-[1px] flex flex-col justify-center items-center text-white px-4 rounded-2xl">
              <h4 className="text-lg font-semibold">{provider.name}</h4>
              <p className="text-sm text-gray-200 mb-2">({provider.role})</p>
              <div className="flex justify-center text-[#FAAB2C] mb-2">
                ★★★★★
              </div>
              <p className="text-sm text-gray-100">
                {provider.exp} &nbsp; {provider.location}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
