import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { ComponentProps, FC } from "react";

interface TextInputProps extends ComponentProps<typeof Input> {
  label?: string;
  error?: string;
}

export const TextInput: FC<TextInputProps> = ({
  label,
  error,
  id,
  className,
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
        className={cn(error && "border-destructive", className)}
        {...props}
      />
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
};
