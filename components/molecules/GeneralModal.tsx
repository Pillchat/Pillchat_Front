"use client";

import { FC } from "react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message?: string;
}

const GeneralModal: FC<ModalProps> = ({ isOpen, onClose, onConfirm, title, message }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      <div
        className="absolute inset-0 bg-black/60"
        onClick={onClose}
      />

      <div className="relative bg-white rounded-lg shadow-lg w-80 max-w-[90%] overflow-hidden">
        <div className="p-6 text-center">
          {title && <h2 className="text-lg font-semibold mb-2">{title}</h2>}
          {message && <p className="text-gray-600">{message}</p>}
        </div>

        <button
          onClick={onConfirm}
          className="w-full py-3 text-center font-semibold text-brand border-t border-gray-200 hover:bg-gray-50"
        >
          확인
        </button>
      </div>
    </div>
  );
};

export default GeneralModal;
