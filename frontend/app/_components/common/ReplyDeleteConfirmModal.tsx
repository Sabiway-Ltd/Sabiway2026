"use client";

import ConfirmDialog from "./ConfirmDialog";

type ReplyDeleteConfirmModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  updating: boolean;
};

export default function ReplyDeleteConfirmModal({ isOpen, onClose, onConfirm, updating }: ReplyDeleteConfirmModalProps) {
  return (
    <ConfirmDialog
      isOpen={isOpen}
      title="Delete reply"
      description="Are you sure you want to delete this reply? This action cannot be undone."
      confirmLabel="Delete"
      loadingLabel="Deleting…"
      tone="danger"
      busy={updating}
      onClose={onClose}
      onConfirm={onConfirm}
    />
  );
}
