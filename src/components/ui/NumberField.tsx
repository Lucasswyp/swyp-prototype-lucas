"use client";

import { useState } from "react";

// Tekstveld voor bedragen en aantallen. Een gewoon getalveld liet "0200" staan als je 200 typte
// na een 0; hier verdwijnen voorloopnullen meteen en mag je een komma of punt gebruiken.
export function cleanNumberText(raw: string, allowDecimals: boolean): string {
  let s = raw.replace(",", ".");
  s = s.replace(allowDecimals ? /[^0-9.]/g : /[^0-9]/g, "");
  if (allowDecimals) {
    const firstDot = s.indexOf(".");
    if (firstDot !== -1) s = s.slice(0, firstDot + 1) + s.slice(firstDot + 1).replace(/\./g, "").slice(0, 2);
  }
  // Voorloopnullen weg ("0200" wordt "200"), maar "0." en "0,5" blijven kloppen.
  return s.replace(/^0+(?=\d)/, "");
}

export function NumberField({
  value,
  onChange,
  allowDecimals = false,
  disabled,
  placeholder = "0",
  className,
  id,
  ariaLabel,
}: {
  value: number;
  onChange: (value: number) => void;
  allowDecimals?: boolean;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
  id?: string;
  ariaLabel?: string;
}) {
  const [text, setText] = useState(value ? String(value) : "");
  // Wijzigt de waarde van buitenaf (bijvoorbeeld "gratis" aanvinken), dan volgt het veld.
  const shown = Number(text || 0) === value ? text : value ? String(value) : "";

  return (
    <input
      id={id}
      type="text"
      inputMode={allowDecimals ? "decimal" : "numeric"}
      autoComplete="off"
      aria-label={ariaLabel}
      value={shown}
      disabled={disabled}
      placeholder={placeholder}
      className={className}
      onChange={(e) => {
        const next = cleanNumberText(e.target.value, allowDecimals);
        setText(next);
        const n = Number(next);
        onChange(Number.isFinite(n) ? n : 0);
      }}
    />
  );
}
