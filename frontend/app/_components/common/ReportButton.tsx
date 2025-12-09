// app/_components/common/ReportButton.tsx

"use client";

import { useState } from "react";
import { toast } from "react-hot-toast";
import { DJANGO_URL } from "@/app/utils/MyConstants";

export default function ReportButton({ postId }) {
  const [showDialog, setShowDialog] = useState(false);
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);

  const postUrl = `${window.location.origin}/posts/${postId}`;

  const handleSendReport = async () => {
  if (!reason.trim()) {
    toast.error("Please enter a reason for reporting.");
    return;
  }

  setLoading(true);
  try {
    // Get token from localStorage
    const token = localStorage.getItem("access");

    if (!token) {
      toast.error("You must be logged in to report a post.");
      setLoading(false);
      return;
    }

    const response = await fetch(`${DJANGO_URL}/api/posts/report/`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`  // ✅ attach token
      },
      body: JSON.stringify({
        post_id: postId,
        reason,
        post_url: postUrl,
      }),
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.detail || "Failed to send report.");
    }

    toast.success("Report sent successfully!");
    setShowDialog(false);
    setReason("");

  } catch (error: any) {
    toast.error(error.message);
    console.error(error);
  } finally {
    setLoading(false);
  }
};



  return (
    <>
      {/* The button that opens the dialog */}
      <button
        onClick={() => setShowDialog(true)}
        className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100 "
      >
        Report this Post
      </button>

      {/* Modal popup */}
      {showDialog && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/40 bg-opacity-40 z-50">
          <div className="bg-white rounded-lg shadow-xl w-96 p-6">
            <h2 className="text-lg font-semibold mb-4">Report this post</h2>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Describe the reason for reporting..."
              className="w-full border rounded-md p-2 mb-4 text-sm h-24 "
            ></textarea>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDialog(false)}
                className="px-4 py-2 text-sm rounded-lg border hover:bg-gray-100"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                onClick={handleSendReport}
                className="px-4 py-2 text-sm rounded-md bg-red-500 text-white hover:bg-red-600"
                disabled={loading}
              >
                {loading ? "Sending..." : "Send"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
