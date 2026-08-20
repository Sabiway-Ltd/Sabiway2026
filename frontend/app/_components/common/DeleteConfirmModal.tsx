"use client";

import ConfirmDialog from "./ConfirmDialog";

interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}

export default function DeleteConfirmModal({ isOpen, onClose, onConfirm }: DeleteConfirmModalProps) {
  return (
    <ConfirmDialog
      isOpen={isOpen}
      title="Delete post"
      description="Are you sure you want to delete this post? This action cannot be undone."
      confirmLabel="Delete"
      loadingLabel="Deleting…"
      tone="danger"
      onClose={onClose}
      onConfirm={onConfirm}
    />
  );
}
