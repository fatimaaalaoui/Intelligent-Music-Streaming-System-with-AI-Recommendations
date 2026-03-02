// src/pages/AlbumPage.jsx
import { useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { useMusic } from "./MusicContext";
const { setAlbumTracks } = useMusic()
export default function AlbumPage() {
  const { id } = useParams();
  const album = useMemo(
    () => albumsData.find((a) => String(a.id) === String(id)) ?? albumsData[0],
    [id]
  );

  // ici, on n'a pas la vraie relation album->songs dans ton dataset,
  // on affiche un échantillon de songsData
  const tracks = songsData.slice(0, 12);

  const gradient = makeHeroGradient(album?.bgColor || "#4b6cb7");

  return (
    <div className="w-full">
      {/* HEADER */}
      <div
        className="rounded-3xl p-6 md:p-8 mb-6 border border-white/10"
        style={{ backgroundImage: gradient }}
      >
        <div className="flex items-end gap-6">
          {/* cover */}
          <div className="h-44 w-44 md:h-52 md:w-52 rounded-xl overflow-hidden shrink-0 ring-1 ring-white/15">
            {album?.image ? (
              <img src={album.image} alt={album.name} className="h-full w-full object-cover" />
            ) : (
              <div className="h-full w-full grid place-items-center bg-white/10">
                <HeartIcon className="h-16 w-16 opacity-80" />
              </div>
            )}
          </div>

          {/* meta */}
          <div className="min-w-0">
            <p className="text-sm text-white/80">Playlist</p>
            <h1 className="text-5xl md:text-7xl font-black leading-tight truncate">
              {album?.name || "Titres likés"}
            </h1>
            <p className="mt-3 text-white/80">
              <span className="font-semibold">Fatimaalaoui</span>
              <span className="mx-2">•</span>
              <span>{tracks.length} titres</span>
            </p>
          </div>
        </div>
      </div>

      {/* BARRE D’ACTIONS */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <button
            className="grid h-14 w-14 place-items-center rounded-full bg-blue-500 text-black shadow-lg"
            title="Lecture"
          >
            <PlayIcon className="h-6 w-6" />
          </button>
          <IconButton title="Lecture aléatoire"><ShuffleIcon /></IconButton>
          <IconButton title="Télécharger"><DownloadIcon /></IconButton>
        </div>

        <div className="flex items-center gap-3 text-white/80">
          <span>Liste</span>
          <DotsIcon />
        </div>
      </div>

      {/* EN-TÊTE TABLE */}
      <div className="grid grid-cols-[32px_1fr_1fr_1fr_60px] gap-3 px-3 py-2 text-white/60 text-sm border-b border-white/10">
        <span>#</span>
        <span>Titre</span>
        <span>Album</span>
        <span>Date d'ajout</span>
        <span className="justify-self-end">
          <ClockIcon />
        </span>
      </div>

      {/* LIGNES */}
      <ul className="divide-y divide-white/10">
        {tracks.map((t, i) => (
          <li
            key={t.id ?? i}
            className="grid grid-cols-[32px_1fr_1fr_1fr_60px] gap-3 px-3 py-3 items-center hover:bg-white/5 rounded"
          >
            <span className="text-white/50">{i + 1}</span>

            {/* Titre + cover + sous-titre */}
            <div className="flex items-center gap-3 min-w-0">
              <img src={t.image} alt="" className="h-11 w-11 rounded object-cover" />
              <div className="min-w-0">
                <p className="truncate font-medium text-white">{t.name}</p>
                <p className="text-xs text-white/70 truncate">{t.desc}</p>
              </div>
            </div>

            <span className="truncate text-white/80">{t.album || t.name}</span>
            <span className="text-white/70">il y a 5 jours</span>

            <span className="justify-self-end text-white/80">{t.duration || "3:00"}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* --------- petits composants / icônes --------- */
function IconButton({ children, title }) {
  return (
    <button
      className="grid h-10 w-10 place-items-center rounded-full bg-white/10 hover:bg-white/15 border border-white/10"
      title={title}
    >
      {children}
    </button>
  );
}

function PlayIcon({ className="" }) {
  return <svg viewBox="0 0 24 24" className={className} fill="currentColor"><path d="M8 5v14l11-7z"/></svg>;
}
function ShuffleIcon(){return(<svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor"><path d="M17 3h4v4h-2V6h-2a5 5 0 0 0-4.24 2.34l-1.52 2.32A7 7 0 0 1 6 13H3v-2h3a5 5 0 0 0 4.24-2.34l1.52-2.32A7 7 0 0 1 17 4h2V3zM21 17v4h-4v-2h2v-1h2zM3 17h3a5 5 0 0 0 4.24 2.34l1.52 2.32A7 7 0 0 0 17 22h2v-1h2v-4h-4v2h2a5 5 0 0 1-4.24-2.34l-1.52-2.32A7 7 0 0 0 6 15H3z"/></svg>)}
function DownloadIcon(){return(<svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor"><path d="M5 20h14v-2H5v2zM11 3h2v8h3l-4 4-4-4h3V3z"/></svg>)}
function DotsIcon(){return(<svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor"><path d="M5 10h2v4H5zm6 0h2v4h-2zm6 0h2v4h-2z"/></svg>)}
function ClockIcon(){return(<svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor"><path d="M12 1a11 11 0 1 0 0 22 11 11 0 0 0 0-22zm1 11h5v2h-7V5h2v7z"/></svg>)}
function HeartIcon({className=""}){return(<svg viewBox="0 0 24 24" className={className} fill="currentColor"><path d="M12 21s-6.716-4.35-9.193-7.078C.75 11.7 2.02 8 5.5 8c1.66 0 3.02.99 3.76 2.4C9.48 8.99 10.84 8 12.5 8c3.48 0 4.75 3.7 2.693 5.922C18.716 16.65 12 21 12 21z"/></svg>)}

/* --------- util: dégradé du header --------- */
function makeHeroGradient(hex = "#4b6cb7") {
  // dégradé façon Spotify: clair en haut, sombre en bas
  return `linear-gradient(180deg, ${shade(hex,30)} 0%, ${shade(hex,-10)} 40%, #0b0b13 100%)`;
}
function shade(hex, amt=0){
  hex = hex.replace("#",""); if(hex.length===3) hex = hex.split("").map(ch=>ch+ch).join("");
  const num = parseInt(hex,16);
  let r=(num>>16)&255, g=(num>>8)&255, b=num&255;
  const adj = (v)=>Math.max(0,Math.min(255,v+amt));
  r=adj(r); g=adj(g); b=adj(b);
  return `#${((1<<24)+(r<<16)+(g<<8)+b).toString(16).slice(1)}`;
}
