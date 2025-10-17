"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>; // make it async so we can await
}

export default function DeleteConfirmModal({
  isOpen,
  onClose,
  onConfirm,
}: DeleteConfirmModalProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleConfirm = async () => {
    setIsDeleting(true);
    try {
      await onConfirm();
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white rounded-xl shadow-lg w-[90%] max-w-sm p-6"
          >
            <h2 className="text-lg font-semibold text-gray-800 mb-2">
              Delete Post
            </h2>
            <p className="text-sm text-gray-600 mb-6">
              Are you sure you want to delete this post? This action cannot be undone.
            </p>

            <div className="flex justify-end gap-3">
              <button
                onClick={onClose}
                disabled={isDeleting}
                className={`px-4 py-2 rounded-full text-sm bg-gray-200 hover:bg-gray-300 transition ${
                  isDeleting ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                disabled={isDeleting}
                className={`px-4 py-2 rounded-full text-sm font-medium text-white transition-colors focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-1 ${
                  isDeleting
                    ? "bg-red-300 cursor-not-allowed opacity-50"
                    : "bg-red-600 hover:bg-red-700"
                }`}
              >
                {isDeleting ? "Deleting..." : "Delete"}
              </button>

            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
