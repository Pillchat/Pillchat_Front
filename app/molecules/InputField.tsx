import React from "react";
import { IconInput } from "./IconInput";

interface InputFieldProps {
  content: string;
}

export function InputField({ content }: InputFieldProps) {
  return (
    <div className="flex flex-col gap-[4px]">
      <p>{content}</p>
      <IconInput />
    </div>
  );
}
