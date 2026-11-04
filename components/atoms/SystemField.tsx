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
  const normalizedIconSrc = iconSrc.startsWith("/") ? iconSrc : `/${iconSrc}`;

  return (
    <button
      type="button"
      className="flex min-h-14 w-full items-center gap-3 rounded-xl text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
      onClick={onClick}
    >
      <img src={normalizedIconSrc} alt="" className="h-10 w-10 shrink-0" />
      <div className="min-w-0 flex-1">
        <p className={`text-title-large ${textColor}`}>{title}</p>
        {description && (
          <p className="mt-1 text-body-medium text-muted-foreground">
            {description}
          </p>
        )}
      </div>
    </button>
  );
}
