"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import NextImage from "next/image"; // <-- rename

type Meta = { thumb: string; full: string; ar: number };
type RowItem = { thumb: string; full: string; w: number; h: number };
type Row = { items: RowItem[]; centered: boolean };

type ExifData = { f?: number; t?: number; iso?: number };
type Exifr = { parse: (input: string, opts?: { pick?: ("FNumber"|"ExposureTime"|"ISO"|"DateTimeOriginal"|"CreateDate")[] }) => Promise<any> };

async function exifPick(url: string): Promise<ExifData> {
  try {
    const mod = (await import("exifr")) as unknown as Exifr;
    const d = await mod.parse(url, { pick: ["FNumber","ExposureTime","ISO"] });
    return {
      f: typeof d?.FNumber === "number" ? d.FNumber : undefined,
      t: typeof d?.ExposureTime === "number" ? d.ExposureTime : undefined,
      iso: typeof d?.ISO === "number" ? d.ISO : undefined,
    };
  } catch { return {}; }
}
function fmtExposure(t?: number) {
  if (!t) return "—";
  if (t >= 1) return `${t.toFixed(1)}s`;
  return `1/${Math.round(1 / t)}s`;
}

/* tiny helper: lazy render children only when in view */
function InView({
  children,
  rootMargin = "200px",
}: { children: (visible: boolean) => React.ReactNode; rootMargin?: string }) {
  const [vis, setVis] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => e.isIntersecting && (setVis(true), io.disconnect()),
      { rootMargin }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [rootMargin]);
  return <div ref={ref}>{children(vis)}</div>;
}

export default function PhotoGallery({
  images,
  targetRowHeight = 300,
  gap = 20,
  topOffset = 120,
}: {
  images: { thumb: string; full: string }[];
  targetRowHeight?: number;
  gap?: number;
  topOffset?: number;
}) {
  const [metas, setMetas] = useState<Meta[]>([]);
  const [open, setOpen] = useState<string | null>(null);
  const [exif, setExif] = useState<ExifData>({});
  const wrapRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);

  // measure container
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setWidth(e.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // load only AR from thumbnails (fast)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const out = await Promise.all(
        images.map(({ thumb, full }) =>
          new Promise<Meta>((res) => {
            const img = new window.Image(); // <-- use DOM Image
            img.onload = () =>
              res({
                thumb,
                full,
                ar: (img.naturalWidth || 1) / (img.naturalHeight || 1),
              });
            img.onerror = () => res({ thumb, full, ar: 1 });
            img.src = thumb;
          })
        )
      );

      if (!cancelled) setMetas(out);
    })();
    return () => {
      cancelled = true;
    };
  }, [images]);

  // lay out justified rows
  const rows: Row[] = useMemo(() => {
    if (!width || metas.length === 0) return [];
    const out: Row[] = [];
    const maxW = width;
    let row: Meta[] = [];
    let arSum = 0;

    const pushRow = (r: Meta[], isLast: boolean) => {
      if (!r.length) return;
      const gaps = gap * (r.length - 1);
      const baseW = r.reduce((s, it) => s + it.ar * targetRowHeight, 0);
      const justify = baseW + gaps > maxW && !isLast;
      const scale = justify ? (maxW - gaps) / baseW : 1;
      const h = Math.max(160, targetRowHeight * scale);
      const items = r.map((it) => ({ thumb: it.thumb, full: it.full, w: it.ar * h, h }));
      out.push({ items, centered: !justify });
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
      if (idx === metas.length - 1) pushRow(row, true);
    });

    return out;
  }, [metas, width, gap, targetRowHeight]);

const [box, setBox] = useState<{ w: number; h: number } | null>(null);

const onOpen = async (src: string) => {
  setOpen(src);
  setExif({});

  const tmp = new window.Image();
  tmp.onload = () => {
    const iw = tmp.naturalWidth || 1;
    const ih = tmp.naturalHeight || 1;

    const maxW = Math.min(window.innerWidth * 0.92, 1400);
    const maxH = Math.min(window.innerHeight * 0.90, 1100);

    const scale = Math.min(maxW / iw, maxH / ih, 1); // fit exactly
    const w = Math.round(iw * scale);
    const h = Math.round(ih * scale);
    setBox({ w, h });
  };
  tmp.src = src;

  const picked = await exifPick(src);
  setExif(picked);
};


  return (
    <>
      <div ref={wrapRef} className="jg-wrap" style={{ marginTop: topOffset }}>
        {rows.map((r, i) => (
          <div
            key={i}
            className={`jg-row${r.centered ? " jg-row--center" : ""}`}
            style={{ gap }}
          >
            {r.items.map((it, j) => (
              <InView key={`${i}-${j}-${it.full}`}>
                {(visible) => (
                  <button
                    className="jg-tile relative overflow-hidden"
                    style={{ width: it.w, height: it.h }}
                    onClick={() => onOpen(it.full)}
                    aria-label="open image"
                  >
                    {/* thumb only loads once visible */}
                    {visible && (
                      <div className="absolute inset-0">
                        <NextImage
                          src={it.thumb}
                          alt=""
                          fill
                          sizes={`${Math.ceil(it.w)}px`}
                          priority={false}
                          placeholder="empty"
                          style={{ objectFit: "cover" }}
                        />

                      </div>
                    )}
                  </button>
                )}
              </InView>
            ))}
          </div>
        ))}

        {rows.length === 0 && (
          <p className="opacity-70 text-sm">loading…</p>
        )}
      </div>

      {open && (
        <div className="lightbox" role="dialog" aria-modal="true" onClick={() => setOpen(null)}>
          <div className="lightbox-inner" onClick={(e) => e.stopPropagation()}>
            <div
              className="mx-auto"
              style={{
                width: box?.w ?? Math.min(window.innerWidth * 0.92, 1400),
                height: box?.h ?? Math.min(window.innerHeight * 0.90, 1100),
              }}
            >
              {box && (
                <NextImage
                  src={open}
                  alt=""
                  width={box.w}
                  height={box.h}
                  sizes={`${box.w}px`}
                  priority
                  style={{ display: "block", width: "100%", height: "100%" }}
                />
              )}
            </div>

            <div className="exif mt-3 text-center">
              <span>{exif.f ? `f/${exif.f.toFixed(1)}` : "f/—"}</span>
              <span> · </span>
              <span>{fmtExposure(exif.t)}</span>
              <span> · </span>
              <span>{exif.iso ? `ISO ${exif.iso}` : "ISO —"}</span>
            </div>
          </div>
          <button className="lightbox-close" aria-label="close" onClick={() => setOpen(null)}>×</button>
        </div>
      )}


    </>
  );
}
