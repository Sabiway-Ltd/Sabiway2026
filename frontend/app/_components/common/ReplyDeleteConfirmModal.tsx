"use client";

import { motion, AnimatePresence } from "framer-motion";

export default function ReplyDeleteConfirmModal({ isOpen, onClose, onConfirm, updating }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 flex items-center justify-center bg-black/40 bg-opacity-40 z-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="bg-white rounded-xl p-5 w-80 shadow-xl"
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0.9 }}
          >
            <h2 className="text-sm font-semibold mb-3">Confirm Delete</h2>
            <p className="text-gray-600 text-xs mb-4">
              Are you sure you want to delete this item? This action cannot be undone.
            </p>

            <div className="flex justify-end gap-2">
              <button
                onClick={onClose}
                disabled={updating}
                className="px-3 py-1 text-xs rounded-md border border-gray-300 hover:bg-gray-100"
              >
                Cancel
              </button>

              <button
                onClick={onConfirm}
                disabled={updating}
                className={`px-3 py-1 text-xs rounded-md text-white bg-red-500 hover:bg-red-600 flex items-center gap-2 ${
                  updating ? "opacity-70 cursor-not-allowed" : ""
                }`}
              >
                {updating ? (
                  <>
                    <svg
                      className="animate-spin h-3.5 w-3.5 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8v8z"
                      ></path>
                    </svg>
                    Deleting...
                  </>
                ) : (
                  "Delete"
                )}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
