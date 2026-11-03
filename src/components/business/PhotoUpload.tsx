"use client";

import { useRef, useState } from "react";
import { Upload } from "lucide-react";
import { uploadAdImage } from "@/lib/data";

// Kies een foto op je computer of telefoon; ze wordt meteen verkleind en geüpload.
export function PhotoUpload({
  businessId,
  imageUrl,
  onChange,
  label = "Foto uploaden",
  changeLabel = "Andere foto kiezen",
}: {
  businessId: string;
  imageUrl?: string;
  onChange: (url: string) => void | Promise<void>;
  label?: string;
  changeLabel?: string;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      const url = await uploadAdImage(businessId, file);
      await onChange(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Uploaden is mislukt. Probeer het opnieuw.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <div className="flex items-center gap-3">
        {imageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imageUrl} alt="" className="h-16 w-16 rounded-lg object-cover bg-white/5" />
        )}
        <button
          type="button"
          onClick={() => input.current?.click()}
          disabled={busy}
          className="inline-flex items-center gap-2 rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm hover:border-violet/50 disabled:opacity-50"
        >
          <Upload size={16} className="text-white/50" />
          {busy ? "Bezig met uploaden..." : imageUrl ? changeLabel : label}
        </button>
        <input ref={input} type="file" accept="image/*" onChange={handleFile} className="hidden" />
      </div>
      {error && <p className="mt-1.5 text-xs text-red-300">{error}</p>}
    </div>
  );
}
