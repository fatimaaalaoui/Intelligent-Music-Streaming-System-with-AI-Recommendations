// src/components/SeeAllAlbums.jsx
import { useLocation, useNavigate } from "react-router-dom";
import { useMemo } from "react";

const pick = (...vals) => vals.find((v) => v !== undefined && v !== null && v !== "");

export default function SeeAllAlbums({ onPlayTrack }) {
  const { state } = useLocation();
  const navigate = useNavigate();

  // ---- Detect type + title
  const type =
    state?.type ||
    (Array.isArray(state?.artists) && state.artists.length ? "artists" : null) ||
    (Array.isArray(state?.tracks) && state.tracks.length ? "tracks" : null) ||
    "albums";

  const title =
    state?.title ||
    (type === "artists"
      ? "Artistes populaires"
      : type === "tracks"
      ? "Titres tendance"
      : "Albums et singles populaires");

  // ---- Data
  const albums = Array.isArray(state?.albums) ? state.albums : [];
  const artists = Array.isArray(state?.artists) ? state.artists : [];
  const rawTracks = Array.isArray(state?.tracks) ? state.tracks : [];

  const count =
    type === "artists" ? artists.length : type === "tracks" ? rawTracks.length : albums.length;

  // ---- Normalize tracks for player (playlist)
  const playlist = useMemo(() => {
    return (rawTracks || [])
      .map((t) => ({
        id: pick(t?._id, t?.id, t?.audioUrl, t?.src),
        title: pick(t?.title, t?.name, "Titre"),
        artist: pick(t?.artistName, t?.artist, "Artiste Jamendo"),
        cover: pick(t?.albumImage, t?.image, t?.cover, ""),
        src: pick(t?.audioUrl, t?.src, ""),
      }))
      .filter((x) => x.id && x.src);
  }, [rawTracks]);

  const play = (track) => {
    if (!onPlayTrack) return;
    if (!playlist.length) return;
    const current = playlist.find((t) => t.id === track.id) || playlist[0];
    onPlayTrack(current, playlist);
  };

  if (!state) {
    return (
      <div className="min-h-[60vh] grid place-items-center text-white">
        <div className="text-center space-y-3">
          <p className="text-white/70">Ouvre cette page via “Tout afficher”.</p>
          <button
            type="button"
            onClick={() => navigate("/")}
            className="rounded-full bg-white text-black px-5 py-2 text-sm font-semibold hover:bg-white/90"
          >
            Retour Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full text-white bg-gradient-to-b from-[#01011c] via-[#01011c] to-[#010112]">
      {/* Header */}
      <div className="px-8 pt-8 pb-6">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="mb-6 grid h-10 w-10 place-items-center rounded-full bg-white/10 hover:bg-white/15 transition"
          aria-label="Retour"
          title="Retour"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5">
            <path
              d="M15 6l-6 6 6 6"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>

        <div className="flex items-baseline justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-4xl md:text-6xl font-black tracking-tight truncate">
              {title}
            </h1>
            <p className="mt-2 text-white/60 text-sm">
              {count}{" "}
              {type === "artists" ? "artistes" : type === "tracks" ? "titres" : "albums"}
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-8 pb-24">
        {type === "albums" && (
          <>
            {albums.length === 0 ? (
              <p className="text-white/60">Aucun album à afficher.</p>
            ) : (
              <AutoGrid>
                {albums.map((a, idx) => {
                  const id = pick(a?._id, a?.id);
                  const name = pick(a?.title, a?.name, `Album ${idx + 1}`);
                  const artist = pick(a?.artistName, a?.artist, "Artiste Jamendo");
                  const img = pick(a?.image, a?.cover, a?.coverUrl, "");

                  return (
                    <Card
                      key={id || idx}
                      image={img}
                      title={name}
                      subtitle={artist}
                      onClick={() =>
                        id && navigate(`/album/${encodeURIComponent(String(id))}`, { state: { album: a } })
                      }
                    />
                  );
                })}
              </AutoGrid>
            )}
          </>
        )}

        {type === "artists" && (
          <>
            {artists.length === 0 ? (
              <p className="text-white/60">Aucun artiste à afficher.</p>
            ) : (
              <AutoGrid>
                {artists.map((a, idx) => {
                  // ✅ IMPORTANT : _id en premier (sinon ArtistPage peut être vide)
                  const id = pick(a?._id, a?.id, a?.artistId, a?.jamendoArtistId);
                  const name = pick(a?.name, a?.artistName, `Artiste ${idx + 1}`);
                  const img = pick(a?.image, a?.picture, a?.photo, "");

                  return (
                    <ArtistCard
                      key={id || idx}
                      image={img}
                      name={name}
                      onClick={() => id && navigate(`/artist/${encodeURIComponent(String(id))}`)}
                    />
                  );
                })}
              </AutoGrid>
            )}
          </>
        )}

        {type === "tracks" && (
          <>
            {playlist.length === 0 ? (
              <p className="text-white/60">Aucun titre à afficher.</p>
            ) : (
              <AutoGrid>
                {playlist.map((t, idx) => (
                  <TrackCard
                    key={t.id || idx}
                    image={t.cover}
                    title={t.title}
                    subtitle={t.artist}
                    onClick={() => play(t)} // ✅ play automatique + playlist complète
                  />
                ))}
              </AutoGrid>
            )}
          </>
        )}
      </div>
    </div>
  );
}

/* ---------------- UI ---------------- */

function AutoGrid({ children }) {
  return (
    <div className="grid gap-6 [grid-template-columns:repeat(auto-fill,minmax(180px,1fr))]">
      {children}
    </div>
  );
}

function Card({ image, title, subtitle, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group text-left rounded-2xl bg-white/5 hover:bg-white/10 transition p-4 border border-white/10 overflow-hidden"
      title={title}
    >
      <div className="aspect-square rounded-xl overflow-hidden bg-black/30">
        {image ? (
          <img
            src={image}
            alt={title}
            className="h-full w-full object-cover group-hover:scale-[1.02] transition"
            loading="lazy"
            draggable={false}
          />
        ) : (
          <div className="h-full w-full grid place-items-center text-3xl">🎵</div>
        )}
      </div>

      <div className="mt-3">
        <div className="font-semibold truncate">{title}</div>
        <div className="text-xs text-white/60 truncate">{subtitle}</div>
      </div>
    </button>
  );
}

function ArtistCard({ image, name, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group text-left rounded-2xl bg-white/5 hover:bg-white/10 transition p-4 border border-white/10 overflow-hidden"
      title={name}
    >
      <div className="aspect-square rounded-full overflow-hidden bg-black/30">
        {image ? (
          <img
            src={image}
            alt={name}
            className="h-full w-full object-cover group-hover:scale-[1.02] transition"
            loading="lazy"
            draggable={false}
          />
        ) : (
          <div className="h-full w-full grid place-items-center text-5xl font-black">
            {(name?.trim()?.charAt(0) || "A").toUpperCase()}
          </div>
        )}
      </div>

      <div className="mt-3">
        <div className="font-semibold truncate">{name}</div>
        <div className="text-xs text-white/60 truncate">Voir les titres</div>
      </div>
    </button>
  );
}

function TrackCard({ image, title, subtitle, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group text-left rounded-2xl bg-white/5 hover:bg-white/10 transition p-4 border border-white/10 overflow-hidden"
      title={title}
    >
      <div className="relative aspect-square rounded-xl overflow-hidden bg-black/30">
        {image ? (
          <img
            src={image}
            alt={title}
            className="h-full w-full object-cover group-hover:scale-[1.02] transition"
            loading="lazy"
            draggable={false}
          />
        ) : (
          <div className="h-full w-full grid place-items-center text-3xl">🎧</div>
        )}

        {/* play hover */}
        <span
          className="
            absolute right-3 bottom-3
            grid h-12 w-12 place-items-center rounded-full
       bg-[#00A3FF]      text-black shadow-lg
            opacity-0 translate-y-2
            group-hover:opacity-100 group-hover:translate-y-0
            transition
          "
          aria-hidden="true"
        >
          <svg viewBox="0 0 24 24" className="h-6 w-6" fill="currentColor">
            <path d="M8 5v14l11-7z" />
          </svg>
        </span>
      </div>

      <div className="mt-3">
        <div className="font-semibold truncate">{title}</div>
        <div className="text-xs text-white/60 truncate">{subtitle}</div>
      </div>
    </button>
  );
}
