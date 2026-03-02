// src/components/NewReleases.jsx
/*import { albumsData } from "../assets/assetes/photo";

export default function NewReleases() {
  const cards = albumsData.slice(0, 6);

  return (
    <section className="px-2 md:px-0">
      <div className="flex items-end justify-between mb-4">
        <h2 className="text-3xl md:text-4xl font-extrabold">Vendredi = nouveautés</h2>
        <button className="text-white/70 hover:text-white text-sm font-semibold">
          Tout afficher
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
        {cards.map((c) => (
          <ReleaseCard key={c.id} title={c.name} cover={c.image} />
        ))}
      </div>
    </section>
  );
}

function ReleaseCard({ title, cover }) {
  return (
    <div className="group rounded-xl bg-[#151515] hover:bg-[#1e1e1e] transition overflow-hidden">
      <div className="relative aspect-square">
        <img src={cover} alt={title} className="h-full w-full object-cover" />
        
        <span className="absolute left-2 top-2 inline-blocks h-5 w-5 rounded-full bg-white/90 text-black grid place-items-center text-[10px] font-bold">
          ⬤
        </span>
      </div>
      <div className="p-3">
        <p className="font-semibold leading-tight line-clamp-2">{title}</p>
        <p className="text-sm text-white/60 line-clamp-2">
          Les meilleures nouveautés à découvrir cette semaine…
        </p>
      </div>
    </div>
  );
}*/
/*
import { useRef, useState, useEffect } from "react";
import { albumsData } from "../assets/assetes/photo";

export default function NewReleases() {
  const railRef = useRef(null);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(true);
  const [activeId, setActiveId] = useState(null);

 
  const updateArrows = () => {
    const el = railRef.current;
    if (!el) return;
    setCanLeft(el.scrollLeft > 0);
    setCanRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 1);
  };

  useEffect(() => {
    updateArrows();
    const el = railRef.current;
    if (!el) return;
    el.addEventListener("scroll", updateArrows, { passive: true });
    const obs = new ResizeObserver(updateArrows);
    obs.observe(el);
    return () => {
      el.removeEventListener("scroll", updateArrows);
      obs.disconnect();
    };
  }, []);

  const scrollBy = (dir = 1) => {
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

  return (
    <section className="relative mx-auto max-w-[1400px] px-4">
      
      <div className="mb-3 flex items-end justify-between">
        <h2 className="text-3xl md:text-4xl font-extrabold">Vendredi = nouveautés</h2>
        <button className="text-white/70 hover:text-white text-sm font-semibold">Tout afficher</button>
      </div>

      
      <div className="relative rounded-3xl bg-[#0f0f1b]/60 border border-white/10 p-4">
      
        <div
          ref={railRef}
          onWheel={onWheel}
          className="flex gap-4 overflow-x-auto scroll-smooth snap-x snap-mandatory
                     [scrollbar-width:none] [-ms-overflow-style:none]"
          style={{ scrollbarWidth: "none" }}
        >
          
          <style>{`
            .no-scrollbar::-webkit-scrollbar { display: none; }
          `}</style>

          {albumsData.map((a, i) => (
            <Card
              key={a.id ?? i}
              album={a}
              active={activeId === a.id}
              onClick={() => setActiveId(a.id)}
            />
          ))}
        </div>

        
        <div className="pointer-events-none absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-[#0f0f1b] to-transparent rounded-l-3xl" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-[#0f0f1b] to-transparent rounded-r-3xl" />

       
        <Arrow
          side="left"
          disabled={!canLeft}
          onClick={() => scrollBy(-1)}
        />
        <Arrow
          side="right"
          disabled={!canRight}
          onClick={() => scrollBy(1)}
        />
      </div>
    </section>
  );
}

function Card({ album, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className="snap-start shrink-0 w-[220px] sm:w-[240px] md:w-[260px]
                 rounded-2xl overflow-hidden bg-[#151523] hover:bg-[#1b1b2d] transition
                 border border-white/10 text-left group"
      type="button"
      title={album.name}
    >
      <div className={`relative aspect-square ${active ? "ring-2 ring-sky-400" : ""}`}>
        <img
          src={album.image}
          alt={album.name}
          className="h-full w-full object-cover"
          draggable={false}
        />

 
        {active && (
          <span
            className="absolute right-2 top-2 grid h-8 w-8 place-items-center rounded-full
                       bg-sky-500 text-black shadow-[0_0_15px_rgba(56,189,248,.8)]"
            title="En écoute"
          >
            <BoltIcon />
          </span>
        )}

 
        <span className="absolute bottom-3 right-3 grid h-10 w-10 place-items-center rounded-full
                         bg-blue-500 text-black shadow-lg opacity-0 translate-y-2
                         group-hover:opacity-100 group-hover:translate-y-0 transition">
          <PlayIcon />
        </span>
      </div>

      <div className="p-3">
        <p className="font-semibold leading-tight line-clamp-2">{album.name}</p>
        {album.desc && (
          <p className="text-sm text-white/60 line-clamp-1">{album.desc}</p>
        )}
      </div>
    </button>
  );
}


function Arrow({ side = "left", disabled, onClick }) {
  const common =
    "absolute top-1/2 -translate-y-1/2 grid place-items-center h-10 w-10 rounded-full " +
    "bg-black/60 hover:bg-black/75 text-white shadow border border-white/10 " +
    "transition disabled:opacity-30 disabled:cursor-not-allowed";
  return (
    <button
      type="button"
      className={`${common} ${side === "left" ? "left-2" : "right-2"}`}
      onClick={onClick}
      disabled={disabled}
      aria-label={side === "left" ? "Précédent" : "Suivant"}
      title={side === "left" ? "Précédent" : "Suivant"}
    >
      {side === "left" ? <ChevronLeft /> : <ChevronRight />}
    </button>
  );
}


function PlayIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true">
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
function BoltIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true">
      <path d="M13 2L3 14h7l-1 8 10-12h-7l1-8z" />
    </svg>
  );
}*/
// src/components/NewReleases.jsx
// src/components/NewReleases.jsx
// src/components/NewReleases.jsx
/*export default function NewReleases({ tracks = [], onPlayTrack }) {
  return (
    <section className="px-4 pt-8 pb-6">
      <div className="flex items-end justify-between mb-4">
        <h2 className="text-3xl md:text-4xl font-extrabold">
          Vendredi = nouveautés
        </h2>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
        {tracks.map((t) => (
          <button
            key={t._id}
            type="button"
            onClick={() =>
              onPlayTrack &&
              onPlayTrack({
                id: t._id,
                title: t.title,
                artist: "Artiste Jamendo",
                cover: t.image,
                src: t.audioUrl,
                duration: t.duration,
              })
            }
            className="text-left bg-white/5 hover:bg-white/10 rounded-lg p-3 transition flex flex-col gap-2"
          >
            <img
              src={t.image}
              alt={t.title}
              className="w-full aspect-square object-cover rounded-md"
            />
            <div>
              <div className="font-semibold truncate">{t.title}</div>
              <div className="text-xs text-white/60 truncate">
                Recommandé pour toi
              </div>
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}
*/
// src/components/NewReleases.jsx
// src/components/NewReleases.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMusic } from "./useMusic";

const API_URL = "http://localhost:5000";

export default function NewReleases({ tracks = [], onPlayTrack }) {
  const dayNames = ["Dimanche","Lundi","Mardi","Mercredi","Jeudi","Vendredi","Samedi"];
  const title = `${dayNames[new Date().getDay()]} = nouveautés`;
  const navigate = useNavigate();

  const { setAlbumTracks, playTrack } = useMusic();

  // ✅ si props vide -> on fetch
  const [items, setItems] = useState(() => (Array.isArray(tracks) ? tracks : []));
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const incoming = Array.isArray(tracks) ? tracks : [];
    if (incoming.length > 0) setItems(incoming);
  }, [tracks]);

  useEffect(() => {
    // si déjà des tracks => pas besoin de fetch
    if (items.length > 0) return;

    let cancelled = false;

    async function load() {
      try {
        setLoading(true);

        // 1) essaye new-releases
        let r = await fetch(`${API_URL}/api/tracks/new-releases?limit=30`);
        if (!r.ok) {
          // 2) fallback tracks
          r = await fetch(`${API_URL}/api/tracks?limit=30`);
        }
        if (!r.ok) return;

        const data = await r.json();
        const list = Array.isArray(data) ? data : (data?.tracks || []);
        if (!cancelled && Array.isArray(list)) setItems(list);
      } catch {
        // silence
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [items.length]);

  // ✅ stocke aussi dans le context (si tu en as besoin ailleurs)
  useEffect(() => {
    setAlbumTracks(items);
  }, [items, setAlbumTracks]);

  const railRef = useRef(null);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(false);

  const updateArrows = () => {
    const el = railRef.current;
    if (!el) return;
    setCanLeft(el.scrollLeft > 5);
    setCanRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 5);
  };

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

  const normalized = useMemo(
    () =>
      items.map((t) => ({
        id: t._id || t.id || t.audioUrl,
        title: t.title || t.name,
        artist: t.artistName || t.artist || "Artiste Jamendo",
        cover: t.image || t.albumImage || null,
        src: t.audioUrl || t.src,
        duration: t.duration,
      })),
    [items]
  );

  const handlePlayOne = (t) => {
    const id = t._id || t.id || t.audioUrl;
    const current = normalized.find((x) => x.id === id) || normalized[0];
    if (!current) return;

    // ✅ joue seulement cette track
    if (onPlayTrack) onPlayTrack(current, normalized);;

    // ✅ historique + currentTrack (toujours)
    playTrack(current);
  };

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
                albums: items, // compat si ton SeeAll lit state.albums
              },
            })
          }
          className="text-white/70 hover:text-white text-sm font-semibold"
        >
          Tout afficher
        </button>
      </div>

      {loading && items.length === 0 && (
        <p className="text-sm text-white/60">Chargement des nouveautés…</p>
      )}

      {!loading && items.length === 0 && (
        <p className="text-sm text-white/60">Aucune track trouvée.</p>
      )}

      {items.length > 0 && (
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
                  key={t._id || t.id || t.audioUrl}
                  type="button"
                  onClick={() => handlePlayOne(t)}
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

                    <span className="absolute left-3 top-3 inline-flex h-7 w-7 rounded-full bg-white text-black text-[11px] font-bold items-center justify-center">
                      ●
                    </span>

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

          <div className="pointer-events-none absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-[#010112] to-transparent" />
          <div className="pointer-events-none absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-[#010112] to-transparent" />

          <Arrow side="left" disabled={!canLeft} onClick={() => scrollBy(-1)} />
          <Arrow side="right" disabled={!canRight} onClick={() => scrollBy(1)} />
        </div>
      )}
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

