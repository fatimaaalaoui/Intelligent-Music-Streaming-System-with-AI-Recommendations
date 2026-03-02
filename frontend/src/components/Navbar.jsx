import { useNavigate, useSearchParams } from "react-router-dom";
import { useState, useRef, useEffect } from "react";

export default function Navbar({ currentUser, onLogout, onSearch }) {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const initialQ = params.get("q") || "";
  const [q, setQ] = useState(initialQ);
  useEffect(() => {
  setQ(initialQ);
}, [initialQ]);

  const inputRef = useRef(null);
   
  const submit = (e) => {
    e.preventDefault();
    const term = q.trim();
    if (!term) return;

    if (onSearch) onSearch(term);
    else navigate(`/search?q=${encodeURIComponent(term)}`);


  };

  const clear = () => {
    setQ("");
    inputRef.current?.focus();
  };

  return (
    <div
      className="w-full h-16 flex items-center px-4
                 bg-[#0b0b0b]/70 backdrop-blur border-b border-white/10
                 shadow-[0_4px_12px_rgba(0,0,0,.35)]"
    >
      {/* Left: back/forward */}
      <div className="flex items-center gap-2">
        <IconRound onClick={() => navigate(-1)} label="Back">
          <ChevronLeft />
        </IconRound>
        <IconRound onClick={() => navigate(1)} label="Forward">
          <ChevronRight />
        </IconRound>
      </div>

      {/* Center: Search */}
      <form
        onSubmit={submit}
        className="flex-1 flex justify-center"
        role="search"
      >
        <div className="relative w-full max-w-xl hidden sm:block">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/70">
            <SearchIcon />
          </span>
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            type="search"
            placeholder="What do you want to play?"
            className="w-full rounded-full bg-[#201f2c] pl-10 pr-10 py-2.5 text-sm placeholder-white/50
                       outline-none border border-white/10 focus:border-white/20"
          />
          {q && (
            <button
              type="button"
              onClick={clear}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/70 hover:text-white"
              aria-label="Clear search"
              title="Clear"
            >
              <CloseIcon />
            </button>
          )}
        </div>

        {/* ultra-small screens: just an icon that focuses the input if present */}
        <button
          type="button"
          className="sm:hidden h-8 w-8 grid place-items-center rounded-full bg-black/60 hover:bg-black/70 text-white"
          onClick={() => inputRef.current?.focus()}
          aria-label="Search"
          title="Search"
        >
          <SearchIcon />
        </button>
      </form>

      {/* Right: login / profil */}
      <div className="flex items-center gap-3">
        {!currentUser ? (
          <>
            <button
              type="button"
              onClick={() => navigate("/login")}
              className="inline-flex items-center rounded-full bg-white text-black px-4 py-1.5 text-sm font-semibold
                         hover:bg-white/90 transition focus-visible:outline-none focus-visible:ring focus-visible:ring-white/30"
            >
              Se connecter
            </button>

            <button
              type="button"
              onClick={() => navigate("/signup")}
              className="inline-flex items-center rounded-full bg-[#121212] text-white px-4 py-1.5 text-sm font-semibold
                         hover:bg-[#1a1a1a] transition border border-white/10 focus-visible:outline-none focus-visible:ring focus-visible:ring-white/20"
            >
              S'inscrire
            </button>
          </>
) : (
  <>
    <UserAvatar name={currentUser?.name} />

    <span className="text-sm text-white/70">
      {currentUser.name}
    </span>

    <button
      type="button"
      onClick={onLogout}
      className="text-xs text-white/50 hover:text-red-400"
    >
      Déconnexion
    </button>
  </>
)}

      </div>
    </div>
  );
}

/* ---------- small building blocks ---------- */
function IconRound({ children, onClick, label }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="h-8 w-8 grid place-items-center rounded-full bg-black/60 hover:bg-black/70
                 text-white transition focus-visible:outline-none focus-visible:ring focus-visible:ring-white/20"
      aria-label={label}
      title={label}
    >
      {children}
    </button>
  );
}

function ChevronLeft() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true">
      <path d="M15.5 5.5L9 12l6.5 6.5-1.5 1.5L6 12l8-8 1.5 1.5z" />
    </svg>
  );
}
function ChevronRight() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true">
      <path d="M8.5 18.5L15 12 8.5 5.5 10 4l8 8-8 8-1.5-1.5z" />
    </svg>
  );
}
function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true">
      <path d="M10 4a6 6 0 104.24 10.24l4.27 4.27 1.41-1.41-4.27-4.27A6 6 0 0010 4zm0 2a4 4 0 110 8 4 4 0 010-8z" />
    </svg>
  );
}
function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true">
      <path d="M6.4 5l12.6 12.6-1.4 1.4L5 6.4 6.4 5zm12.6 1.4L6.4 19.1 5 17.7 17.7 5l1.3 1.4z" />
    </svg>
  );
}
function UserAvatar({ name = "U" }) {
  const initial = (name || "U").trim().charAt(0).toUpperCase();
  const bg = pickPastel(initial);

  return (
    <div
      className="relative h-9 w-9 rounded-full overflow-hidden ring-2 ring-black/40"
      style={{ backgroundColor: bg }}
      title={name}
      aria-label="Profile"
    >
      <div className="h-full w-full grid place-items-center text-sm font-bold text-white">
        {initial}
      </div>
      <span className="absolute -right-0.5 -bottom-0.5 h-3 w-3 rounded-full bg-emerald-500 ring-2 ring-[#0b0b0b]" />
    </div>
  );
}

function pickPastel(initial) {
  const palette = ["#A78BFA", "#93C5FD", "#6EE7B7", "#FDE68A", "#FCA5A5", "#F9A8D4", "#99F6E4"];
  const idx = (initial.charCodeAt(0) + palette.length) % palette.length;
  return palette[idx];
}
