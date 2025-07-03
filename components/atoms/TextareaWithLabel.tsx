import { ComponentProps, forwardRef } from "react";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";

interface TextareaWithLabelProps extends ComponentProps<typeof Textarea> {
  label: string;
  maxLength?: number;
  errorMessage?: string;
}

export const TextareaWithLabel = forwardRef<
  HTMLTextAreaElement,
  TextareaWithLabelProps
>(
  (
    { label, maxLength = 1000, value = "", onChange, errorMessage, ...props },
    ref,
  ) => {
    return (
      <div className="grid w-full gap-2">
        <Label htmlFor="message">{label}</Label>
        <Textarea
          ref={ref}
          id="message"
          value={value}
          onChange={onChange}
          maxLength={maxLength}
          {...props}
        />
        <div className="flex items-center justify-between">
          {errorMessage && (
            <p className="text-sm text-destructive">{errorMessage}</p>
          )}
          <p className="ml-auto text-right text-xs text-border">
            {typeof value === "string" ? value.length : 0} / {maxLength}
          </p>
        </div>
      </div>
    );
  },
);

TextareaWithLabel.displayName = "TextareaWithLabel";
