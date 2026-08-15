"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import Image from "next/image";
import Navbar from "../_components/landing_page/Navbar";
import Footer from "../_components/landing_page/Footer";
import { Wallet, Users, MapPin, Shield, Star } from "lucide-react";

/* ================================================================
   ========================== MAIN PAGE ============================
   ================================================================ */

export default function HelpCenterPage() {
  return (
    <div className="bg-[#ffffff]">
      {/* NAVBAR */}
      <Navbar />
      <br />

      {/* ========================= HERO ========================= */}
      <section className="w-full flex justify-center mt-12 md:mt-24 px-4 sm:px-6">
        <div className="w-full max-w-[1150px] bg-[#008753] text-white rounded-3xl px-6 md:px-10 py-8 md:py-10 text-center shadow-[0_4px_20px_rgba(0,135,83,0.2)]">
          <p className="text-xs sm:text-sm font-semibold tracking-widest opacity-90">
            HELP CENTER
          </p>

          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mt-3 md:mt-4">
            How can we help you today?
          </h1>

          <p className="mt-4 md:mt-6 text-sm md:text-base lg:text-lg max-w-3xl mx-auto leading-relaxed opacity-95 px-2 sm:px-0">
            Find answers, explore guides, and get support whether you're a client
            booking services or a provider growing your business on SabiWay.
          </p>
        </div>
      </section>


      {/* ========================= WHAT MAKES US DIFFERENT ========================= */}
      <section className="mt-12 md:mt-20 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-center text-2xl sm:text-3xl font-bold text-[#003022]">
            What Makes Us Different
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 mt-8 md:mt-10">
            <FeatureCard
              icon={<Wallet size={28} className="text-[#008753]" />}
              title="SabiPay"
              text="Our secure escrow payment system protects both customers and service providers. Your payment is held safely and released only when the job is completed to your satisfaction, ensuring fairness and trust on both sides."
            />

            <FeatureCard
              icon={<Users size={28} className="text-[#008753]" />}
              title="SabiForum"
              text="SabiWay is also a community. On SabiForum, you can ask questions, get recommendations, share experiences and learn from Nigerians around the world."
            />

            <FeatureCard
              icon={<MapPin size={28} className="text-[#008753]" />}
              title="Geolocation"
              text="Our location-based search connects you with trusted professionals in your neighbourhood. You can see ratings, reviews and estimated arrival times, making it easy to book nearby service providers without stress."
            />

            <FeatureCard
              icon={<Shield size={28} className="text-[#008753]" />}
              title="Verified Professionals"
              text="Every professional on SabiWay is vetted through ID checks, credentials and transparent reviews so you can book confidently knowing you are hiring skilled and trustworthy providers."
            />

            <FeatureCard
              icon={<Star size={28} className="text-[#008753]" />}
              title="Complete Service Coverage"
              text="SabiWay brings all your everyday service needs into one platform, from grooming and cleaning to home repairs and urgent fixes."
            />
          </div>
        </div>
      </section>

      {/* ========================= THREE INFORMATION CARDS ========================= */}
      <section className="max-w-[1200px] mx-auto px-4 sm:px-6 mt-12 md:mt-20 space-y-6 md:space-y-10">
        <InfoCard
          title="What We Are Building"
          children={
            <ul className="list-disc pl-5 md:pl-6 space-y-2 text-gray-700 text-sm md:text-base lg:text-lg leading-relaxed">
              <li>
                We are creating more than just a platform. We are building a
                community where people can find and hire vetted and highly skilled
                local service providers with ease.
              </li>
              <li>
                Local service providers can showcase their expertise, build their
                reputation and get access to users.
              </li>
              <li>
                People from various backgrounds can connect, share ideas and get
                answers to their questions.
              </li>
            </ul>
          }
        />

        <InfoCard
          title="Where We Are Going"
          text="It is still day one, we understand we have a lot to learn and we are constantly evolving. We are committed to researching the best ways to serve both people and local service providers. Most importantly, we are focused on what matters most: making life easier for people and local service providers."
        />

        <InfoCard
          title="Join Our Community"
          text="Whether you're looking for skilled local services or you're a service provider ready to grow your business, we'd love to have you with us as we build something meaningful. This is just the beginning of our story. We're excited to write the next chapter with you."
        />
      </section>

      {/* =====================================================
         SIDE-BY-SIDE CLIENT + PROVIDER SECTIONS
      ===================================================== */}
      <section className="max-w-[1300px] mx-auto mt-16 md:mt-24 px-4 sm:px-6 grid lg:grid-cols-2 gap-6 md:gap-10">
        {/* LEFT: CLIENT */}
        <div>
          <ClientOrProviderCard
            title="For Clients"
            subtitle="TRUSTED LOCAL SERVICE PROVIDERS AT YOUR FINGERTIPS"
            text="Finding reliable local service providers shouldn't be a gamble. SabiWay connects you with verified Nigerian professionals across electricians, plumbers, barbers, cleaners and more. Every provider is background-checked, rated by real customers, and ready to serve your neighborhood."
          />

          <FAQList
            faqs={[
              {
                question: "How does payment work?",
                answer:
                  "Your payment is held securely in escrow. You release it only when the work is completed to your satisfaction. This protects you from substandard work and guarantees providers get paid for quality service.",
              },
              {
                question: "How does SabiWay work?",
                answer:
                  "Users can browse through verified local service providers, view their profiles and reviews, and hire them directly for their service needs.",
              },
              {
                question: "What types of services can I find on SabiWay?",
                answer:
                  "You can find hair salons, electricians, plumbers, painters, mechanics, barbershops, and many other service-based businesses.",
              },
              {
                question: "Are service providers verified?",
                answer:
                  "Yes, all service providers go through credential checks, background verification and review monitoring to ensure quality and trustworthiness.",
              },
              {
                question: "How do I know I can trust a provider?",
                answer:
                  "Each provider profile includes verified credentials, transparent customer reviews, and ratings from previous clients.",
              },
            ]}
          />
        </div>

        {/* RIGHT: PROVIDERS */}
        <div>
          <ClientOrProviderCard
            title="For Service Providers"
            subtitle="FIND TRUSTED CLIENTS HOME AND ABROAD"
            text="Start selling your services right away on SabiWay, leveraging high-end tools to stay in contact with customers who need your services. Set your rates, showcase your skills, and get paid securely for every completed job through our escrow system."
            extra={
              <div className="grid gap-3 text-gray-700 mt-4 text-sm md:text-base lg:text-lg leading-relaxed">
                <div>
                  <h4 className="font-semibold">Guaranteed Payment</h4>
                  <p>
                    Get paid for every job through our secure escrow system. No
                    chasing payments or dealing with disputes.
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold">Expand Your Reach</h4>
                  <p>
                    Access clients across multiple cities and regions. Build your
                    business beyond word-of-mouth.
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold">Build Your Reputation</h4>
                  <p>
                    Collect verified reviews, showcase credentials, and let your
                    work speak for itself.
                  </p>
                </div>
              </div>
            }
          />

          <FAQList
            faqs={[
              {
                question: "How do I get paid?",
                answer:
                  "Payment is guaranteed through our SabiPay escrow system. When you complete a job to the client's satisfaction, funds are released directly to you.",
              },
              {
                question: "How much does SabiWay charge?",
                answer:
                  "A small service fee is deducted per completed booking. You set your rates and always see your earnings before accepting any job.",
              },
              {
                question: "How do I get verified on the platform?",
                answer:
                  "Submit your credentials, complete a background check, and provide references. Verification typically takes 3–5 business days.",
              },
            ]}
          />
        </div>
      </section>

      {/* ========================= CONTACT US ========================= */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 mt-16 md:mt-28">
        <ContactForm />
      </section>

      {/* ========================= SUPPORT & FEEDBACK ========================= */}
      <section className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6 px-4 sm:px-6 mt-8 md:mt-10 pb-12 md:pb-20">
        <SupportCard />
        <FeedbackCard />
      </section>

      <Footer />
    </div>
  );
}

/* ================================================================
   ================= COMPONENTS BELOW ===============================
   ================================================================ */

function FeatureCard({ icon, title, text }: { icon: ReactNode; title: string; text: string }) {
  return (
    <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-[0_2px_12px_rgba(0,0,0,0.08)] hover:shadow-[0_4px_20px_rgba(0,0,0,0.12)] transition-shadow duration-300">
      <div className="flex justify-center sm:justify-start">{icon}</div>
      <h3 className="text-base sm:text-lg font-semibold mt-3 sm:mt-4 text-center sm:text-left">{title}</h3>
      <p className="text-gray-700 text-sm md:text-base lg:text-lg mt-2 leading-relaxed text-center sm:text-left">
        {text}
      </p>
    </div>
  );
}

function InfoCard({ title, text, children }: { title: string; text?: string; children?: ReactNode }) {
  return (
    <div className="bg-white rounded-2xl p-6 md:p-8 shadow-[0_2px_12px_rgba(0,0,0,0.08)] hover:shadow-[0_4px_20px_rgba(0,0,0,0.12)] transition-shadow duration-300">
      <h3 className="text-lg md:text-xl font-bold mb-3">{title}</h3>
      {text && (
        <p className="text-gray-700 leading-relaxed text-sm md:text-base lg:text-lg">
          {text}
        </p>
      )}
      {children}
    </div>
  );
}

/* ================================================================
   ===================== UPDATED FAQ LIST ==========================
   ================================================================ */

type FAQ = { question: string; answer: string };

function FAQList({ faqs }: { faqs: FAQ[] }) {
  const [openFAQ, setOpenFAQ] = useState<number | null>(null);

  return (
    <div className="mt-8 md:mt-10 space-y-4 sm:space-y-5 md:space-y-6">
      {faqs.map((faq, i) => (
        <div
          key={i}
          className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden transition-all duration-300 hover:shadow-md"
        >
          <button
            onClick={() => setOpenFAQ(openFAQ === i ? null : i)}
            className="w-full flex justify-between items-center bg-[#008753] text-white font-semibold px-4 sm:px-6 py-3 sm:py-4 text-left focus:outline-none"
          >
            <span className="text-sm sm:text-base md:text-lg pr-3">
              {faq.question}
            </span>
            <Image
              src="/faqstar.png"
              alt="FAQ Icon"
              width={18}
              height={18}
              className={`transition-transform duration-300 w-4 h-4 sm:w-5 sm:h-5 ${
                openFAQ === i ? "rotate-180" : ""
              }`}
            />
          </button>

          <div
            className={`transition-all duration-500 ease-in-out overflow-hidden ${
              openFAQ === i
                ? "max-h-[400px] opacity-100 py-4 sm:py-5"
                : "max-h-0 opacity-0 py-0"
            }`}
          >
            <div className="px-4 sm:px-6">
              <p className="text-gray-800 text-left leading-relaxed text-sm sm:text-base md:text-lg">
                {faq.answer}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function ClientOrProviderCard({ title, subtitle, text, extra }: { title: string; subtitle: string; text: string; extra?: ReactNode }) {
  return (
    <div className="bg-white rounded-3xl p-6 md:p-8 lg:p-10 text-left shadow-[0_2px_12px_rgba(0,0,0,0.08)] hover:shadow-[0_4px_20px_rgba(0,0,0,0.12)] transition-shadow duration-300">
      <h2 className="text-2xl md:text-3xl font-bold">{title}</h2>
      <h3 className="text-lg md:text-xl font-semibold mt-2 md:mt-3 text-[#003022]">
        {subtitle}
      </h3>
      <p className="mt-3 md:mt-4 text-gray-700 leading-relaxed text-sm md:text-base lg:text-lg">
        {text}
      </p>
      {extra}
    </div>
  );
}

/* ================================================================
   ========================== CONTACT FORM =========================
   ================================================================ */

function ContactForm() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    setLoading(true);

    const formData = {
      name: (form.elements.namedItem("name") as HTMLInputElement).value,
      email: (form.elements.namedItem("email") as HTMLInputElement).value,
      type: (form.elements.namedItem("type") as HTMLSelectElement).value,
      message: (form.elements.namedItem("message") as HTMLTextAreaElement).value,
    };

    const response = await fetch("/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    });

    setLoading(false);

    if (response.ok) {
      setSuccess(true);
      e.target.reset();
    } else {
      alert("There was an error sending your message.");
    }
  };

  return (
    <div className="bg-white rounded-[28px] p-6 md:p-8 lg:p-10 shadow-[0_2px_12px_rgba(0,0,0,0.08)] hover:shadow-[0_4px_20px_rgba(0,0,0,0.12)] transition-shadow duration-300">
      <h2 className="text-xl md:text-2xl font-bold">Contact Us</h2>
      <p className="mt-2 text-gray-700 text-sm md:text-base lg:text-lg">
        We are always here to help. Send us a message and we will respond within 24 hours.
      </p>

      <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
        {/* NAME + EMAIL */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            name="name"
            type="text"
            placeholder="Enter your name"
            className="w-full border border-gray-200 rounded-xl p-3 bg-white 
                       text-black placeholder:text-gray-400
                       focus:outline-none focus:ring-2 focus:ring-[#008753] focus:border-transparent"
            required
          />

          <input
            name="email"
            type="email"
            placeholder="you@example.com"
            className="w-full border border-gray-200 rounded-xl p-3 bg-white 
                       text-black placeholder:text-gray-400
                       focus:outline-none focus:ring-2 focus:ring-[#008753] focus:border-transparent"
            required
          />
        </div>

        {/* SELECT */}
        <select
          name="type"
          className="w-full border border-gray-200 rounded-xl p-3 bg-white text-black
                     focus:outline-none focus:ring-2 focus:ring-[#008753] focus:border-transparent"
        >
          <option className="text-black">General support</option>
          <option className="text-black">Client question</option>
          <option className="text-black">Service provider question</option>
          <option className="text-black">Partnership</option>
        </select>

        {/* MESSAGE */}
        <textarea
          name="message"
          rows={4}
          placeholder="Write your message here..."
          className="w-full border border-gray-200 rounded-xl p-3 bg-white 
                     text-black placeholder:text-gray-400
                     focus:outline-none focus:ring-2 focus:ring-[#008753] focus:border-transparent"
          required
        />

        {/* BUTTON */}
        <button
          className="w-full bg-[#008753] text-white py-3 rounded-xl font-semibold
                     shadow-[0_2px_8px_rgba(0,135,83,0.3)]
                     hover:shadow-[0_4px_12px_rgba(0,135,83,0.4)]
                     hover:bg-[#007a48] transition-all duration-300"
        >
          {loading ? "Sending..." : "Send message"}
        </button>

        {success && (
          <p className="text-green-600 text-center font-semibold mt-2">
            Message sent successfully!
          </p>
        )}
      </form>
    </div>
  );
}

function SupportCard() {
  return (
    <div className="bg-white rounded-3xl p-6 md:p-8 shadow-[0_2px_12px_rgba(0,0,0,0.08)] hover:shadow-[0_4px_20px_rgba(0,0,0,0.12)] transition-shadow duration-300">
      <h3 className="text-lg md:text-xl font-bold">Email Support</h3>

      <p className="mt-3 md:mt-4 text-gray-700 text-sm md:text-base lg:text-lg">
        For general inquiries, assistance, and platform support:
      </p>
      <p className="font-semibold text-[#008753]">support@sabiway.com</p>

      <p className="mt-3 md:mt-4 text-gray-700 text-sm md:text-base lg:text-lg">
        For business partnerships, collaborations, and media inquiries:
      </p>
      <p className="font-semibold text-[#008753]">info@sabiway.com</p>
    </div>
  );
}

function FeedbackCard() {
  return (
    <div className="bg-white rounded-3xl p-6 md:p-8 shadow-[0_2px_12px_rgba(0,0,0,0.08)] hover:shadow-[0_4px_20px_rgba(0,0,0,0.12)] transition-shadow duration-300">
      <h3 className="text-lg md:text-xl font-bold">Feedback and Suggestions</h3>
      <p className="mt-3 md:mt-4 text-gray-700 text-sm md:text-base lg:text-lg">
        We're constantly improving, and your voice matters. You can share your
        feedback and suggestions using the form above.
      </p>
    </div>
  );
}