/*import { useState } from "react";

export default function FilterChips({ defaultValue = "all", onChange }) {
  const [active, setActive] = useState(defaultValue);

  const set = (val) => {
    setActive(val);
    onChange?.(val);
  };

  return (
    <div className="rounded-2xl p-4 mb-4
                    bg-gradient-to-r from-[#4b2ca3]/70 via-[#2a3a8a]/60 to-[#0b0b2a]/40
                    border border-white/10 shadow-[0_10px_30px_rgba(0,0,0,.35)]">
      <div className="flex items-center gap-3 flex-wrap">
        <Chip active={active === "all"} onClick={() => set("all")} icon={<AllIcon />}>
          Tout
        </Chip>
        <Chip active={active === "music"} onClick={() => set("music")} icon={<MusicIcon />}>
          Musique
        </Chip>
        <Chip active={active === "podcasts"} onClick={() => set("podcasts")} icon={<PodcastIcon />}>
          Podcasts
        </Chip>
      </div>
    </div>
  );
}

function Chip({ active, onClick, icon, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition
        ${active
          ? "bg-white text-black"
          : "bg-white/10 text-white hover:bg-white/20 border border-white/10"
        }`}
      aria-pressed={active}
    >
      <span className={`grid place-items-center h-5 w-5 ${active ? "text-black" : "text-white"}`}>
        {icon}
      </span>
      <span>{children}</span>
    </button>
  );
}


function AllIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true">
      <path d="M4 4h7v7H4V4zm9 0h7v7h-7V4zM4 13h7v7H4v-7zm9 0h7v7h-7v-7z"/>
    </svg>
  );
}
function MusicIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true">
      <path d="M12 3v10.55A4 4 0 1 1 10 9V6h8V3h-6z"/>
    </svg>
  );
}
function PodcastIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true">
      <path d="M12 3a7 7 0 0 0-4 12.89V21h2v-6a2 2 0 1 1 4 0v6h2v-5.11A7 7 0 0 0 12 3zm0 2a5 5 0 0 1 3 9.14V12a3 3 0 1 0-6 0v2.14A5 5 0 0 1 12 5z"/>
    </svg>
  );
}*/


import { useState } from "react";

export default function FilterChips({ value, defaultValue = "all", onChange }) {
  const [active, setActive] = useState(defaultValue);
  const current = value ?? active;

  const set = (val) => {
    if (value === undefined) setActive(val);
    onChange?.(val);
  };

  return (
    <div className="rounded-2xl p-4 mb-4
                    bg-gradient-to-r from-[#4b2ca3]/70 via-[#2a3a8a]/60 to-[#0b0b2a]/40
                    border border-white/10 shadow-[0_10px_30px_rgba(0,0,0,.35)]">
      <div className="flex items-center gap-3 flex-wrap">
        <Chip active={current === "all"} onClick={() => set("all")} icon={<AllIcon />}>
          Tout
        </Chip>
        <Chip active={current === "music"} onClick={() => set("music")} icon={<MusicIcon />}>
          Musique
        </Chip>
        <Chip active={current === "artists"} onClick={() => set("artists")} icon={<ArtistIcon />}>
          Artistes
        </Chip>
      </div>
    </div>
  );
}

function Chip({ active, onClick, icon, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition
        ${active
          ? "bg-white text-black"
          : "bg-white/10 text-white hover:bg-white/20 border border-white/10"
        }`}
      aria-pressed={active}
    >
      <span className={`grid place-items-center h-5 w-5 ${active ? "text-black" : "text-white"}`}>
        {icon}
      </span>
      <span>{children}</span>
    </button>
  );
}

function AllIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true">
      <path d="M4 4h7v7H4V4zm9 0h7v7h-7V4zM4 13h7v7H4v-7zm9 0h7v7h-7v-7z" />
    </svg>
  );
}
function MusicIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true">
      <path d="M12 3v10.55A4 4 0 1 1 10 9V6h8V3h-6z" />
    </svg>
  );
}
// même icône que ton PodcastIcon (ça garde le même style)
function ArtistIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true">
      <path d="M12 3a7 7 0 0 0-4 12.89V21h2v-6a2 2 0 1 1 4 0v6h2v-5.11A7 7 0 0 0 12 3zm0 2a5 5 0 0 1 3 9.14V12a3 3 0 1 0-6 0v2.14A5 5 0 0 1 12 5z" />
    </svg>
  );
}
