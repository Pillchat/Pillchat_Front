"use client";
import type { ReactNode } from "react";
import * as Primitive from "@radix-ui/react-dialog";
import { Dialog } from "@/components/ui/dialog";

export function ModalSurface({
  open = true,
  onClose,
  title,
  children,
  className = "z-50",
  closeOnBackdrop = true,
  backdropClassName = "bg-black/60",
}: {
  open?: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  className?: string;
  closeOnBackdrop?: boolean;
  backdropClassName?: string;
}) {
  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        if (!value) onClose();
      }}
    >
      <Primitive.Portal>
        <Primitive.Overlay
          className={`fixed inset-0 ${backdropClassName} ${className}`}
        />
        <Primitive.Content
          aria-describedby={undefined}
          className={`app-modal-surface fixed inset-x-0 flex items-center justify-center outline-none ${className}`}
          onClick={(event) => {
            if (closeOnBackdrop && event.target === event.currentTarget)
              onClose();
          }}
        >
          <Primitive.Title className="sr-only">{title}</Primitive.Title>
          {children}
        </Primitive.Content>
      </Primitive.Portal>
    </Dialog>
  );
}
