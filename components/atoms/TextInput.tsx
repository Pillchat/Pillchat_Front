import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { ComponentProps, FC } from "react";

type TextInputProps = ComponentProps<typeof Input> & {
  label?: string;
  errorMessage?: string;
};

export const TextInput: FC<TextInputProps> = ({
  label,
  errorMessage,
  id,
  className,
  error,
  ...props
}) => {
  return (
    <div className="w-full space-y-1">
      {label && (
        <Label htmlFor={id} className="text-xs font-normal">
          {label}
        </Label>
      )}
      <Input
        id={id}
        error={!!errorMessage || error}
        className={className}
        {...props}
      />
      {errorMessage && (
        <p className="text-sm text-destructive">{errorMessage}</p>
      )}
    </div>
  );
};
