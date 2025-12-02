"use client";

import { FC } from "react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message1?: string;
  message2?: string;
}

export const SubmitModal: FC<ModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message1,
  message2,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />

      <div className="relative w-80 max-w-[90%] overflow-hidden rounded-lg bg-white shadow-lg">
        <div className="p-6 text-center">
          {title && <h2 className="mb-2 text-lg font-semibold">{title}</h2>}
          {message1 && <p className="text-gray-600">{message1}</p>}
          {message2 && <p className="text-gray-600">{message2}</p>}
        </div>

        <button
          onClick={onConfirm}
          className="w-full border-t border-gray-200 py-3 text-center font-semibold text-black hover:bg-gray-50"
        >
          확인
        </button>
      </div>
    </div>
  );
};
