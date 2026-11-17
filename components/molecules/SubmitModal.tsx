"use client";

import { FC } from "react";
import { ModalSurface } from "./ModalSurface";

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
    <ModalSurface onClose={onClose} title={title || "확인"}>
      <div className="relative max-h-[calc(100dvh-2rem-env(safe-area-inset-top)-env(safe-area-inset-bottom))] w-80 max-w-[90%] overflow-y-auto overscroll-contain rounded-xl bg-white shadow-lg">
        <div className="px-6 py-8 text-center">
          {title && <h2 className="mb-2 text-lg font-semibold">{title}</h2>}
          {message1 && <p className="text-gray-600">{message1}</p>}
          {message2 && <p className="text-gray-600">{message2}</p>}
        </div>

        <button
          onClick={onConfirm}
          className="w-full border-t border-gray-200 py-4 text-center font-semibold text-black hover:bg-gray-50"
        >
          확인
        </button>
      </div>
    </ModalSurface>
  );
};
