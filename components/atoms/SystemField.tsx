interface option {
  iconSrc: string;
  title: string;
  description?: string;
  textColor?: string;
  onClick?: () => void;
}

export function SystemField({
  iconSrc,
  title,
  description,
  textColor = "text-black",
  onClick,
}: option) {
  return (
    <div className="flex w-full flex-row items-center gap-2" onClick={onClick}>
      <img src={`/${iconSrc}`} className="h-10 w-10" />
      <div className="flex flex-col">
        <p className={`text-lg ${textColor}`}>{title}</p>
        <p className="text-sm font-light text-button-foreground">
          {description}
        </p>
      </div>
    </div>
  );
}
