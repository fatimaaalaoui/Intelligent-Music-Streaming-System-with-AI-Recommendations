/*import FilterChips from "./FilterChips";
import { albumsData } from "../assets/assetes/photo";
import { Link } from "react-router-dom";
// si séparé

{albumsData.slice(0, 6).map(t => (
  <Link key={t.id} to={`/album/${t.id}`} className="block">
    <LongTile title={t.name} cover={t.image} />
  </Link>
))}

export default function HeroShelf() {
  // on prend 7 éléments pour compléter deux rangées (Liked + 7 = 8 tuiles)
  const tiles = albumsData.slice(0, 7);

  return (
    <div className="rounded-3xl p-4 md:p-5 mb-8
                    bg-gradient-to-b from-[#3b2b76] via-[#2a275a] to-transparent
                    border border-white/10 shadow-[0_10px_30px_rgba(0,0,0,.35)]">
      <FilterChips />

     
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
        
        <LongTile
          gradient
          title="Titres likés"
        />

        {tiles.map((t) => (
          <LongTile key={t.id} title={t.name} cover={t.image} />
        ))}
      </div>
    </div>
  );
}

function LongTile({ title, cover, gradient = false }) {
  return (
    <button
      type="button"
      className="group relative w-full rounded-xl border border-white/10 overflow-hidden text-left"
    >
      
      <span
        className="absolute inset-0 rounded-xl opacity-100
                   bg-gradient-to-r 
                   transition-opacity duration-300 group-hover:opacity-0"
        aria-hidden="true"
      />
      
      <span
        className="absolute inset-0 rounded-xl opacity-0
                   bg-gradient-to-r from-[#3b2b76] via-[#6a4bdc] to-[#2ac3ff]
                   transition-opacity duration-300 group-hover:opacity-100"
        aria-hidden="true"
      />

      
      <div className="relative z-10 flex items-center gap-4 p-4">
        
        <div className="h-14 w-14 rounded-lg overflow-hidden shrink-0 ring-1 ring-white/10">
          {gradient ? (
            <div className="h-full w-full grid place-items-center
                            bg-gradient-to-br from-violet-500 via-fuchsia-500 to-emerald-300">
              <div className="h-9 w-9 rounded-md bg-white grid place-items-center">
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="#7c4dff">
                  <path d="M12 21s-6.716-4.35-9.193-7.078C.75 11.7 2.02 8 5.5 8c1.66 0 3.02.99 3.76 2.4C9.48 8.99 10.84 8 12.5 8c3.48 0 4.75 3.7 2.693 5.922C18.716 16.65 12 21 12 21z"/>
                </svg>
              </div>
            </div>
          ) : (
            <img src={cover} alt="" className="h-full w-full object-cover" />
          )}
        </div>

        
        <p className="truncate font-semibold flex-1">{title}</p>

        
        <span
          className="opacity-0 group-hover:opacity-100 transition
                     grid place-items-center h-9 w-9 rounded-full ring-sky-600 text-black shadow-lg mr-1"
          title="Lire"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
            <path d="M8 5v14l11-7z" />
          </svg>
        </span>
      </div>
    </button>
  );
}
function Tile({ id, title, coverSrc, coverGradient, hovered, ...rest }) {
  return (
    <Link to={`/album/${id}`} className="block">
      <div className="relative w-full rounded-xl bg-white/[0.06] border border-white/10 overflow-hidden">
      </div>
    </Link>
  );
}*/

// src/components/HeroShelf.jsx
// src/components/HeroShelf.jsx
// src/components/HeroShelf.jsx
// src/components/HeroShelf.jsx
// src/components/HeroShelf.jsx
// src/components/HeroShelf.jsx

// src/components/HeroShelf.jsx
// src/components/HeroShelf.jsx
import { Link } from "react-router-dom";

export default function HeroShelf({
  albums = [],
  hasLikedTracks = false,
  onOpenLikedTracks,
}) {
  const heroAlbums = Array.isArray(albums) ? albums.slice(0, 8) : [];

  return (
    <section className="mx-auto max-w-[1200px] px-6 pt-2">
      <div
        className="rounded-3xl p-4 md:p-6 mb-4
                   bg-gradient-to-b from-[#4b2ca3]/80 via-[#2a3a8a]/70 to-[#0b0b2a]/60
                   border border-white/10 shadow-[0_10px_30px_rgba(0,0,0,0.35)]
                   space-y-4"
      >
        {/* ✅ PLUS DE CHIPS ICI */}

        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
          {hasLikedTracks && <LongTileLiked onClick={onOpenLikedTracks} />}

          {heroAlbums.map((album) => (
            <LongTileAlbum key={album._id || album.id} album={album} />
          ))}
        </div>
      </div>
    </section>
  );
}

function LongTileLiked({ onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group relative w-full rounded-xl border border-white/10
                 overflow-hidden text-left bg-white/10 hover:bg-white/15 transition"
    >
      <span
        className="pointer-events-none absolute inset-0 rounded-xl opacity-0
                   bg-gradient-to-r from-[#3b2b76] via-[#6a4bdc] to-[#2ac3ff]
                   transition-opacity duration-300 group-hover:opacity-100"
        aria-hidden="true"
      />

      <div className="relative z-10 flex items-center gap-4 p-4">
        <div className="h-14 w-14 rounded-lg overflow-hidden shrink-0 ring-1 ring-white/10">
          <div className="h-full w-full grid place-items-center bg-gradient-to-br from-violet-500 via-fuchsia-500 to-emerald-300">
            <div className="h-9 w-9 rounded-md bg-white grid place-items-center">
              <HeartIcon />
            </div>
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <p className="truncate font-semibold">Titres likés</p>
          <p className="truncate text-xs text-white/70">Vos chansons…</p>
        </div>

        <span
          className="pointer-events-none opacity-0 group-hover:opacity-100 transition
                     grid place-items-center h-10 w-10 rounded-full bg-[#2cbde1]
                     shadow-lg mr-1"
          aria-hidden="true"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5 fill-black">
            <path d="M8 5v14l11-7z" />
          </svg>
        </span>
      </div>
    </button>
  );
}

function LongTileAlbum({ album }) {
  const id = album?._id || album?.id;
  const title = album?.title || album?.name || "Album";
  const cover = album?.image || album?.cover || album?.coverUrl || "";

  return (
    <Link to={`/album/${encodeURIComponent(String(id))}`} className="block">
      <div
        className="group relative w-full rounded-xl border border-white/10
                   overflow-hidden text-left bg-white/5 hover:bg-white/10 transition"
      >
        <div className="relative z-10 flex items-center gap-4 p-4">
          <div className="h-14 w-14 rounded-lg overflow-hidden shrink-0 ring-1 ring-white/10 bg-black/20">
            {cover ? (
              <img src={cover} alt={title} className="h-full w-full object-cover" />
            ) : (
              <div className="h-full w-full grid place-items-center text-white/40 text-xs">
                Album
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <p className="truncate font-semibold">{title}</p>
            <p className="truncate text-xs text-white/70"> </p>
          </div>

          <span
            className="pointer-events-none opacity-0 group-hover:opacity-100 transition
                       grid place-items-center h-10 w-10 rounded-full bg-[#2cbde1]
                       shadow-lg mr-1"
            aria-hidden="true"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5 fill-black">
              <path d="M8 5v14l11-7z" />
            </svg>
          </span>
        </div>
      </div>
    </Link>
  );
}

function HeartIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="#7c4dff">
      <path d="M12 21s-6.716-4.35-9.193-7.078C.75 11.7 2.02 8 5.5 8c1.66 0 3.02.99 3.76 2.4C9.48 8.99 10.84 8 12.5 8c3.48 0 4.75 3.7 2.693 5.922C18.716 16.65 12 21 12 21z" />
    </svg>
  );
}







// src/components/HeroShelf.jsx
// src/components/HeroShelf.jsx
// src/components/HeroShelf.jsx
/*import FilterChips from "./FilterChips";

const HERO_PLAYLISTS = [
  { id: "liked", title: "Titres likés", gradient: true },
  { id: "top-viral", title: "Top Viral Throwbacks" },
  { id: "soft-pop", title: "Soft Pop Hits" },
  { id: "hits-chill", title: "Hits chill" },
  { id: "top-hits", title: "today’s Tops Hits" },
  { id: "daily-mix", title: "Daily Mix" },
  { id: "all-out-2020s", title: "All Out 2020s" },
  { id: "lana", title: "This Is Lana Del Ray" },
];

// albums = tes albums Jamendo (pour piquer des covers)
export default function HeroShelf({ albums = [] }) {
  // on prend quelques covers parmi tes albums pour décorer les playlists
  const covers = albums.slice(0, HERO_PLAYLISTS.length);

  return (
    <section className="mx-auto max-w-[1400px] px-4">
      <div
        className="rounded-3xl p-4 md:p-6 mb-8
                   bg-gradient-to-b from-[#4b2ca3]/80 via-[#2a3a8a]/70 to-[#0b0b2a]/60
                   border border-white/10 shadow-[0_10px_30px_rgba(0,0,0,0.35)]"
      >
        
        <div className="mb-4">
          <FilterChips />
        </div>

        
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {HERO_PLAYLISTS.map((pl, idx) => (
            <LongTile
              key={pl.id}
              title={pl.title}
              gradient={pl.gradient}
              cover={covers[idx]?.image}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function LongTile({ title, cover, gradient = false }) {
  return (
    <button
      type="button"
      className="group relative w-full rounded-xl border border-white/10
                 overflow-hidden text-left bg-white/5 hover:bg-white/10 transition"
      onClick={() => console.log("Clique sur :", title)}
    >
      
      <span
        className="pointer-events-none absolute inset-0 rounded-xl opacity-0
                   bg-gradient-to-r from-[#3b2b76] via-[#6a4bdc] to-[#2ac3ff]
                   transition-opacity duration-300 group-hover:opacity-100"
        aria-hidden="true"
      />

      <div className="relative z-10 flex items-center gap-4 p-4">
        
        <div className="h-14 w-14 rounded-lg overflow-hidden shrink-0 ring-1 ring-white/10">
          {gradient ? (
            <div className="h-full w-full grid place-items-center
                            bg-gradient-to-br from-violet-500 via-fuchsia-500 to-emerald-300">
              <div className="h-9 w-9 rounded-md bg-white grid place-items-center">
                <HeartIcon />
              </div>
            </div>
          ) : cover ? (
            <img src={cover} alt={title} className="h-full w-full object-cover" />
          ) : (
            <div className="h-full w-full grid place-items-center bg-white/10 text-xs">
              Playlist
            </div>
          )}
        </div>

       
        <p className="truncate font-semibold flex-1">{title}</p>

       
        <span
          className="pointer-events-none opacity-0 group-hover:opacity-100 transition
                     grid place-items-center h-9 w-9 rounded-full bg-blue-500
                     text-black shadow-lg mr-1"
          aria-hidden="true"
        >
          ▶
        </span>
      </div>
    </button>
  );
}

function HeartIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="#7c4dff">
      <path d="M12 21s-6.716-4.35-9.193-7.078C.75 11.7 2.02 8 5.5 8c1.66 0 3.02.99 3.76 2.4C9.48 8.99 10.84 8 12.5 8c3.48 0 4.75 3.7 2.693 5.922C18.716 16.65 12 21 12 21z" />
    </svg>
  );
}
*/