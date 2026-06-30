import { ComponentProps, FC } from "react";

import { TextField } from "./TextField";

type TextInputProps = ComponentProps<typeof TextField> & {
  label?: string;
  errorMessage?: string;
};

export const TextInput: FC<TextInputProps> = ({
  label,
  errorMessage,
  className,
  ...props
}) => {
  return (
    <TextField
      label={label}
      errorMessage={errorMessage}
      inputClassName={className}
      {...props}
    />
  );
};
