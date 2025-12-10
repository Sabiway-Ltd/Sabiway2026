"use client";

import { useState, useRef } from "react";
import axios from "axios";
import { WAITLIST_URL } from "@/app/utils/MyConstants";


export default function WaitlistForm({ onSuccess, show }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const [popup, setPopup] = useState({
    show: false,
    title: "",
    message: "",
    success: true,
  });

  const popupRef = useRef(null);

  if (!show) return null; // Don't render if show is false

  // Close the success/error popup
  const closePopup = () => {
    setPopup({ ...popup, show: false });

    // If success, close the main waitlist modal
    if (popup.success && onSuccess) {
      onSuccess();
    }
  };

  // Show the success/error popup
  const showPopup = (title, message, success = true) => {
    setPopup({ show: true, title, message, success });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!name.trim() || !email.trim()) {
      showPopup("Missing Info ⚠️", "Please enter your name and email.", false);
      return;
    }

    setLoading(true);

    try {
      const res = await axios.post(`${WAITLIST_URL}/api/waitlist`, { name, email });

      if (res.data.status === "success" || res.data.success) {
        showPopup(
          "Success 🎉",
          "You’re on the waitlist! We'll be in touch soon.",
          true
        );
        setName("");
        setEmail("");
        // Do NOT call onSuccess() here — wait for user to close the success popup
      } else {
        showPopup(
          "Oops 😕",
          res.data.message || "Something went wrong.",
          false
        );
      }
    } catch (error) {
      if (error.response) {
        showPopup(
          "Error ❌",
          error.response.data.message || `Request failed (${error.response.status})`,
          false
        );
      } else {
        showPopup("Network Error 🌐", "Please try again.", false);
      }
    }

    setLoading(false);
  };

  return (
    <>
      {/* MAIN POPUP + BACKDROP */}
      <div
        className="fixed inset-0 z-[9999] flex items-center justify-center px-4 bg-black/20 backdrop-blur-sm"
        onClick={(e) => {
          if (popupRef.current && !popupRef.current.contains(e.target)) {
            onSuccess && onSuccess(); // Click outside closes main modal
          }
        }}
      >
        <div
          ref={popupRef}
          className="bg-white rounded-lg md:rounded-xl shadow-2xl border border-gray-100 p-4 md:p-5 w-full max-w-md animate-fadeIn"
          onClick={(e) => e.stopPropagation()} // Prevent inside clicks from closing
        >
          {/* HEADER */}
          <div className=" items-center mb-4">
            <div className="flex justify-end">
                <button
                onClick={() => onSuccess && onSuccess()}
                className="text-gray-400 hover:text-gray-600 transition text-2xl leading-none"
                >
                ×
                </button>
            </div>

            <h2 className="text-2xl md:text-3xl text-center font-bold text-gray-900">
              Join App Waitlist 
            </h2>
          </div>

          <p className="text-gray-600 mb-6 text-sm md:text-base text-center leading-relaxed">
            Be among the first to get the app when we launch.  
            We’ll only email you important updates — no spam.
          </p>

          {/* FORM */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-gray-700 font-semibold mb-1">
                Full Name
              </label>
              <input
                type="text"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 
                  focus:ring-2 focus:ring-green focus:border-green outline-none transition"
                required
              />
            </div>

            <div>
              <label className="block text-gray-700 font-semibold mb-1">
                Email Address
              </label>
              <input
                type="email"
                placeholder="john@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 
                  focus:ring-2 focus:ring-green focus:border-green outline-none transition"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#008753] text-white rounded-lg font-bold shadow-md py-3 
                hover:shadow-lg hover:-translate-y-0.5 transition active:scale-[0.98] 
                disabled:opacity-60 disabled:hover:translate-y-0"
            >
              {loading ? "Joining..." : "Join Waitlist "}
            </button>
          </form>
        </div>
      </div>

      {/* SUCCESS / ERROR POPUP */}
      {popup.show && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
          <div className="bg-white rounded-3xl p-8 shadow-xl max-w-sm w-full text-center animate-fadeIn">
            <h3
              className={`text-2xl font-bold ${
                popup.success ? "text-green" : "text-red-600"
              }`}
            >
              {popup.title}
            </h3>
            <p className="text-gray-600 mt-2">{popup.message}</p>

            <button
              onClick={closePopup}
              className="mt-5 px-6 py-2 bg-green text-black rounded-xl font-bold 
                shadow hover:-translate-y-0.5 transition active:scale-[0.97]"
            >
              OK
            </button>
          </div>
        </div>
      )}
    </>
  );
}
