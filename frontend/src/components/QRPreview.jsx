import React, { useEffect, useState, useRef } from "react";
import { api } from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";

/** Live QR preview via /api/qr/preview (POSTs current design + data). */
export default function QRPreview({ type, data, design, is_dynamic = true, size = 320 }) {
  const [src, setSrc] = useState(null);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setLoading(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await api.post("/qr/preview", { type, data, design, is_dynamic, size }, { responseType: "blob" });
        const url = URL.createObjectURL(res.data);
        setSrc((prev) => { if (prev) URL.revokeObjectURL(prev); return url; });
      } catch (_) {} finally { setLoading(false); }
    }, 250);
    return () => debounceRef.current && clearTimeout(debounceRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type, JSON.stringify(data), JSON.stringify(design), is_dynamic, size]);

  return (
    <div className="relative aspect-square bg-white border border-border grid place-items-center p-4">
      {loading && !src && <Skeleton className="w-full h-full rounded-none" />}
      {src && <img src={src} alt="QR preview" className="max-w-full h-auto" data-testid="qr-preview-img" />}
    </div>
  );
}
