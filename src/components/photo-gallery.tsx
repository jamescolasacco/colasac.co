"use client";
import { useEffect, useMemo, useRef, useState } from "react";

// lazy exif parser
async function exifPick(url: string) {
  try {
    const exifr = (await import("exifr")).default as any;
    const d = await exifr.parse(url, {
      pick: ["FNumber", "ExposureTime", "ISO", "DateTimeOriginal", "CreateDate"],
    });
    const taken =
      (d?.DateTimeOriginal instanceof Date ? d.DateTimeOriginal : undefined) ||
      (d?.CreateDate instanceof Date ? d.CreateDate : undefined);
    return {
      f: typeof d?.FNumber === "number" ? d.FNumber : undefined,
      t: typeof d?.ExposureTime === "number" ? d.ExposureTime : undefined,
      iso: typeof d?.ISO === "number" ? d.ISO : undefined,
      taken: taken ? taken.getTime() : undefined,
    };
  } catch {
    return {};
  }
}

function fmtExposure(t?: number) {
  if (!t) return undefined;
  if (t >= 1) return `${t.toFixed(1)}s`;
  const d = Math.round(1 / t);
  return `1/${d}s`;
}

type Meta = {
  thumb: string;
  full: string;
  ar: number;
  taken?: number;
};
type RowItem = { thumb: string; full: string; w: number; h: number };

type Row = { items: RowItem[]; centered: boolean };

export default function PhotoGallery({
  images,
  targetRowHeight = 300, // row target height
  gap = 20,              // space between tiles
  topOffset = 120,       // push grid down from fixed logo
  sort = "desc",         // "desc" newest first, "asc" oldest first
}: {
  images: { thumb: string; full: string }[];
  targetRowHeight?: number;
  gap?: number;
  topOffset?: number;
  sort?: "asc" | "desc";
}) {
  const [metas, setMetas] = useState<Meta[]>([]);
  const [open, setOpen] = useState<string | null>(null);
  const [exif, setExif] = useState<{ f?: number; t?: number; iso?: number }>({});
  const exifCache = useRef<Record<string, { f?: number; t?: number; iso?: number; taken?: number }>>({});

  const wrapRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState<number>(0);

  // measure container width
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setWidth(e.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // load aspect ratios + exif date to enable sorting
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const metas = await Promise.all(
      images.map(
        ({ thumb, full }) =>
          new Promise<Meta>(async (res) => {
            const img = new Image();
            img.onload = async () => {
              let taken = exifCache.current[full]?.taken;
              if (taken === undefined) {
                const picked = await exifPick(full);
                taken = picked.taken;
                exifCache.current[full] = { ...(exifCache.current[full] || {}), taken };
              }
              res({
                thumb,
                full,
                ar: (img.naturalWidth || 1) / (img.naturalHeight || 1),
                taken,
              });
            };
            img.onerror = async () => {
              let taken = exifCache.current[full]?.taken;
              if (taken === undefined) {
                const picked = await exifPick(full);
                taken = picked.taken;
                exifCache.current[full] = { ...(exifCache.current[full] || {}), taken };
              }
              res({ thumb, full, ar: 1, taken });
            };
            img.src = thumb;
          })
      )
    );

      if (cancelled) return;

      // sort by date taken if present
      const sorted = metas.slice().sort((a, b) => {
        const ad = a.taken ?? 0;
        const bd = b.taken ?? 0;
        return sort === "desc" ? bd - ad : ad - bd;
      });

      setMetas(sorted);
    })();
    return () => {
      cancelled = true;
    };
  }, [images, sort]);

  // layout rows (justified), center the last not-full row
  const rows: Row[] = useMemo(() => {
    if (!width || metas.length === 0) return [];
    const out: Row[] = [];
    const maxW = width;
    let row: Meta[] = [];
    let arSum = 0;

    const pushRow = (r: Meta[], isLast: boolean) => {
      if (r.length === 0) return;
      const gaps = gap * (r.length - 1);
      const baseW = r.reduce((s, it) => s + it.ar * targetRowHeight, 0);

      // if row exceeds width, scale to justify; if last row and small, don't stretch
      const shouldJustify = baseW + gaps > maxW && !isLast;
      const scale = shouldJustify ? (maxW - gaps) / baseW : 1;
      const h = Math.max(160, targetRowHeight * scale);
      const items = r.map((it, idx) => ({
        thumb: it.thumb,
        full: it.full,
        w: it.ar * h,
        h,
        _k: `${it.full}-${h}-${idx}`, // if you prefer: use this as key
      }));



      out.push({ items, centered: !shouldJustify }); // center if not justified (typically the last row)
    };

    metas.forEach((m, idx) => {
      const nextBaseW = (arSum + m.ar) * targetRowHeight + gap * row.length;
      row.push(m);
      arSum += m.ar;
      if (nextBaseW >= maxW) {
        pushRow(row, false);
        row = [];
        arSum = 0;
      }
      // push final row at the end
      if (idx === metas.length - 1) pushRow(row, true);
    });

    return out;
  }, [metas, width, gap, targetRowHeight]);

  // open + fetch detailed exif for display (cached)
  const onOpen = async (src: string) => {
    setOpen(src);
    if (exifCache.current[src]?.f !== undefined) {
      const { f, t, iso } = exifCache.current[src];
      setExif({ f, t, iso });
      return;
    }
    setExif({});
    const picked = await exifPick(src);
    exifCache.current[src] = { ...(exifCache.current[src] || {}), ...picked };
    const { f, t, iso } = picked;
    setExif({ f, t, iso });
  };

  return (
    <>
      <div ref={wrapRef} className="jg-wrap" style={{ marginTop: topOffset }}>
        {rows.map((r, i) => (
          <div key={i} className={`jg-row${r.centered ? " jg-row--center" : ""}`} style={{ gap }}>
            {r.items.map((it, j) => (
              <button
                key={`${i}-${j}-${it.full}`} /* unique per sibling */
                className="jg-tile"
                style={{ width: it.w, height: it.h }}
                onClick={() => onOpen(it.full)}
                aria-label="open image"
              >
                <img src={it.thumb} alt="" loading="lazy" decoding="async" />
              </button>
            ))}
          </div>
        ))}

        {rows.length === 0 && (
          <p className="opacity-70 text-sm">
            loading...
          </p>
        )}
      </div>

      {open && (
        <div className="lightbox" role="dialog" aria-modal="true" onClick={() => setOpen(null)}>
          <div className="lightbox-inner" onClick={(e) => e.stopPropagation()}>
            <img src={open} alt="" />
            <div className="exif">
              <span>{exif.f ? `f/${exif.f.toFixed(1)}` : "f/—"}</span>
              <span>·</span>
              <span>{exif.t ? fmtExposure(exif.t) : "—"}</span>
              <span>·</span>
              <span>{exif.iso ? `ISO ${exif.iso}` : "ISO —"}</span>
            </div>
          </div>
          <button className="lightbox-close" aria-label="close" onClick={() => setOpen(null)}>
            ×
          </button>
        </div>
      )}
    </>
  );
}
