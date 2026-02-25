"use client";

import { FC } from "react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message?: string;
}

export const SelectModal: FC<ModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />

      <div className="relative w-80 max-w-[90%] overflow-hidden rounded-lg bg-white shadow-lg">
        <div className="p-6 text-center">
          {title && <h2 className="mb-2 text-lg font-semibold">{title}</h2>}
          {message && (
            <p className="whitespace-pre-line text-gray-600">{message}</p>
          )}
        </div>

        <div className="flex border-t border-gray-200">
          <button
            onClick={onClose}
            className="w-1/2 py-3 text-center font-semibold text-gray-600 hover:bg-gray-50"
          >
            취소
          </button>
          <button
            onClick={onConfirm}
            className="w-1/2 border-l border-gray-200 py-3 text-center font-semibold text-brand hover:bg-gray-50"
          >
            확인
          </button>
        </div>
      </div>
    </div>
  );
};
