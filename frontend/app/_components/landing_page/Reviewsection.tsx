"use client";

export default function Reviewsection() {
  const reviews = [
    {
      text: "SabiWay helped me find a painter in less than 1 hour. Super fast and very trustworthy service!",
      name: "Amina B.",
      location: "Abuja",
    },
    {
      text: "I booked a cleaner through SabiWay and the service was excellent. Highly recommended!",
      name: "Chinedu O.",
      location: "Lagos",
    },
    {
      text: "Thanks to SabiWay, I got a fitness trainer near me the same day. Amazing platform!",
      name: "Fatima K.",
      location: "Kano",
    },
    {
      text: "I love how quick and reliable this platform is. Will definitely keep using it.",
      name: "Emeka I.",
      location: "Port Harcourt",
    },
  ];

  return (
    <section className="w-full text-center  py-16 sm:py-20 md:py-24 lg:py-32 bg-gray-50 overflow-hidden">
      {/* Title */}
      <h3 className="text-gray-500 font-medium text-sm sm:text-base mb-2 sm:mb-3">
        What people are saying
      </h3>
      <h2 className="text-xl sm:text-2xl md:text-4xl text-gray-900 mb-10 sm:mb-12">
        Real stories from customers and service providers
      </h2>

      {/* First Row - Left to Right */}
      <div className="marquee-container mb-10">
        <div className="marquee-track marquee-left">
          {[...reviews, ...reviews].map((review, i) => (
            <ReviewCard key={`left-${i}`} review={review} />
          ))}
        </div>
      </div>

      {/* Second Row - Right to Left */}
      <div className="marquee-container">
        <div className="marquee-track marquee-right">
          {[...reviews, ...reviews].map((review, i) => (
            <ReviewCard key={`right-${i}`} review={review} />
          ))}
        </div>
      </div>

      <style jsx>{`
        .marquee-container {
          overflow: hidden;
          position: relative;
          width: 100%;
        }

        .marquee-track {
          display: flex;
          width: max-content; /* ensures content stretches only as wide as needed */
        }

        .marquee-left {
          animation: scroll-left 35s linear infinite;
        }

        .marquee-right {
          animation: scroll-right 35s linear infinite;
        }

        @keyframes scroll-left {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }

        @keyframes scroll-right {
          0% {
            transform: translateX(-50%);
          }
          100% {
            transform: translateX(0);
          }
        }

        @media (max-width: 768px) {
          .marquee-left,
          .marquee-right {
            animation-duration: 45s;
          }
        }
      `}</style>
    </section>
  );
}

type Review = {
  text: string;
  name: string;
  location: string;
};

// Separate component for cleaner code
function ReviewCard({ review }: { review: Review }) {
  return (
    <div className=" w-[20rem] text-sm md:w-[30rem] text-lg bg-white border border-gray-200 rounded-xl p-5 sm:p-6 shadow-sm hover:shadow-md transition-all duration-300 mx-3">
      <p className="text-base sm:text-lg text-gray-700 italic leading-relaxed">
        “{review.text}”
      </p>
      <div className="flex justify-center mt-4 text-[#FAAB2C] text-lg">★★★★★</div>
      <p className="mt-2 text-xs sm:text-sm text-gray-600">
        - {review.name} from {review.location}
      </p>
    </div>
  );
}
