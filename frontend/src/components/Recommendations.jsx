import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Recommendations({
  currentUser,
  hasLikedTracks = false,
  limit = 20,
  onPlayTrack,
}) {
  const navigate = useNavigate();
  const railRef = useRef(null);

  const [items, setItems] = useState([]);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(false);

  const userId = currentUser?._id || currentUser?.id;

  const updateArrows = () => {
    const el = railRef.current;
    if (!el) return;
    setCanLeft(el.scrollLeft > 5);
    setCanRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 5);
  };

  useEffect(() => {
    // pas connecté / pas likes => on cache (comme tu veux)
    if (!userId || !hasLikedTracks) {
      setItems([]);
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const r = await fetch(
          `http://localhost:5000/api/users/${userId}/recommendations/hybrid?limit=${limit}`
        );
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        const data = await r.json();

        const tracks = (Array.isArray(data) ? data : [])
          .map((x) => x?.track || x)
          .filter(Boolean);

        if (!cancelled) setItems(tracks);
      } catch (e) {
        if (!cancelled) setItems([]);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [userId, hasLikedTracks, limit]);

  useEffect(() => {
    updateArrows();
    const el = railRef.current;
    if (!el) return;

    const onScroll = () => updateArrows();
    el.addEventListener("scroll", onScroll, { passive: true });

    const obs = new ResizeObserver(updateArrows);
    obs.observe(el);

    return () => {
      el.removeEventListener("scroll", onScroll);
      obs.disconnect();
    };
  }, [items.length]);

  const scrollBy = (dir) => {
    const el = railRef.current;
    if (!el) return;
    const step = Math.round(el.clientWidth * 0.85);
    el.scrollBy({ left: dir * step, behavior: "smooth" });
  };

  const onWheel = (e) => {
    const el = railRef.current;
    if (!el) return;
    if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
      e.preventDefault();
      el.scrollLeft += e.deltaY;
    }
  };

  // rien à afficher => rien
  if (!userId || !hasLikedTracks || items.length === 0) return null;

  const title = "Recommandé pour toi";

  return (
    <section className="px-4 pt-4 pb-6">
      <div className="flex items-end justify-between mb-4">
        <h2 className="text-3xl md:text-4xl font-extrabold">{title}</h2>

        <button
          type="button"
          onClick={() =>
            navigate("/see-all", {
              state: {
                title,
                type: "tracks",
                tracks: items,
                albums: items, // compatibilité avec ton SeeAll qui lit state.albums
              },
            })
          }
          className="text-white/70 hover:text-white text-sm font-semibold"
        >
          Tout afficher
        </button>
      </div>

      <div className="relative">
        <div
          ref={railRef}
          onWheel={onWheel}
          className="flex gap-5 overflow-x-auto scroll-smooth
                     [scrollbar-width:none] [-ms-overflow-style:none]"
          style={{ scrollbarWidth: "none" }}
        >
          <style>{`.no-scrollbar::-webkit-scrollbar{display:none;}`}</style>

          {items.map((t) => {
            const genre =
              t.mainGenre ||
              (Array.isArray(t.tags) && t.tags.length > 0 ? t.tags[0] : "Jamendo");

            return (
              <button
                key={t._id}
                type="button"
                onClick={() =>
                  onPlayTrack?.({
                    id: t._id,
                    title: t.title,
                    artist: t.artistName || "Artiste",
                    cover: t.image,
                    src: t.audioUrl,
                    duration: t.duration,
                  })
                }
                className="shrink-0 w-[220px] md:w-[240px] text-left group"
              >
                <div className="relative aspect-square rounded-2xl overflow-hidden bg-white/5 border border-white/10">
                  {t.image ? (
                    <img src={t.image} alt={t.title} className="h-full w-full object-cover" />
                  ) : (
                    <div className="h-full w-full grid place-items-center bg-gradient-to-br from-purple-500 to-emerald-400 text-3xl">
                      🎵
                    </div>
                  )}

                  {/* petit rond blanc en haut à gauche */}
                  <span className="absolute left-3 top-3 inline-flex h-7 w-7 rounded-full bg-white text-black text-[11px] font-bold items-center justify-center">
                    ●
                  </span>

                  {/* bouton play en hover */}
                  <span
                    className="absolute right-3 bottom-3 grid h-11 w-11 place-items-center rounded-full
                               bg-blue-500 text-black shadow-lg opacity-0 translate-y-2
                               group-hover:opacity-100 group-hover:translate-y-0 transition"
                    aria-hidden="true"
                  >
                    <PlayIcon />
                  </span>
                </div>

                <div className="mt-3">
                  <div className="font-semibold truncate">{t.title}</div>
                  <div className="text-xs text-white/60 truncate">{genre}</div>
                </div>
              </button>
            );
          })}
        </div>

        {/* dégradés sur les côtés */}
        <div className="pointer-events-none absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-[#010112] to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-[#010112] to-transparent" />

        {/* flèches */}
        <Arrow side="left" disabled={!canLeft} onClick={() => scrollBy(-1)} />
        <Arrow side="right" disabled={!canRight} onClick={() => scrollBy(1)} />
      </div>
    </section>
  );
}

function Arrow({ side, disabled, onClick }) {
  if (disabled) return null;

  const cls =
    "absolute top-1/2 -translate-y-1/2 grid place-items-center h-10 w-10 rounded-full " +
    "bg-black/60 hover:bg-black/75 text-white shadow border border-white/10 transition";

  return (
    <button
      type="button"
      className={`${cls} ${side === "left" ? "left-2" : "right-2"}`}
      onClick={onClick}
      aria-label={side === "left" ? "Précédent" : "Suivant"}
      title={side === "left" ? "Précédent" : "Suivant"}
    >
      {side === "left" ? <ChevronLeft /> : <ChevronRight />}
    </button>
  );
}

function PlayIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="currentColor" aria-hidden="true">
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}
function ChevronLeft() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true">
      <path d="M15.5 5.5L9 12l6.5 6.5-1.5 1.5L6 12l8-8 1.5 1.5z" />
    </svg>
  );
}
function ChevronRight() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true">
      <path d="M8.5 18.5L15 12 8.5 5.5 10 4l8 8-8 8-1.5-1.5z" />
    </svg>
  );
}
