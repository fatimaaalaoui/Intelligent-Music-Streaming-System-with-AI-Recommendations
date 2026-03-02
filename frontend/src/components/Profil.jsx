// src/components/SeeAllAlbums.jsx
import { useLocation, useNavigate } from "react-router-dom";

const pick = (...vals) => vals.find((v) => v !== undefined && v !== null);

export default function SeeAllAlbums() {
  const { state } = useLocation();
  const navigate = useNavigate();

  const type =
    state?.type ||
    (Array.isArray(state?.artists) ? "artists" : null) ||
    (Array.isArray(state?.tracks) ? "tracks" : null) ||
    (Array.isArray(state?.albums) ? "albums" : "albums");

  const title =
    state?.title ||
    (type === "artists"
      ? "Artistes populaires"
      : type === "tracks"
      ? "Titres tendance"
      : "Albums et singles populaires");

  const albums = Array.isArray(state?.albums) ? state.albums : [];
  const tracks = Array.isArray(state?.tracks) ? state.tracks : [];
  const artists = Array.isArray(state?.artists) ? state.artists : [];

  const count = type === "artists" ? artists.length : type === "tracks" ? tracks.length : albums.length;

  // --- Normalizers ---
  const normalizeAlbum = (a, idx) => {
    const id = pick(a?._id, a?.id);
    const name = pick(a?.title, a?.name, `Album ${idx + 1}`);
    const artist = pick(a?.artistName, a?.artist, "Artiste Jamendo");
    const img = pick(a?.image, a?.cover, a?.coverUrl, "");
    return { id, name, artist, img, raw: a };
  };

  const normalizeArtist = (a, idx) => {
    // ✅ IMPORTANT : on met _id en premier sinon ArtistPage peut être vide
    const id = pick(a?._id, a?.id, a?.artistId, a?.jamendoArtistId);
    const name = pick(a?.name, a?.artistName, `Artiste ${idx + 1}`);
    const img = pick(a?.image, a?.picture, a?.photo, "");
    return { id, name, img, raw: a };
  };

  const normalizeTrack = (t, idx) => {
    const id = pick(t?._id, t?.id, t?.audioUrl, t?.src, `track-${idx}`);
    const title = pick(t?.title, t?.name, `Piste ${idx + 1}`);
    const artist = pick(t?.artistName, t?.artist, "Artiste Jamendo");
    const img = pick(t?.albumImage, t?.image, t?.cover, "");
    return { id, title, artist, img, raw: t };
  };

  return (
    <div className="min-h-screen w-full text-white bg-gradient-to-b from-[#01011c] via-[#01011c] to-[#010112]">
      <div className="px-8 pt-8 pb-6">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="mb-6 grid h-10 w-10 place-items-center rounded-full bg-white/10 hover:bg-white/15 transition"
          aria-label="Retour"
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

        <div className="flex items-baseline justify-between">
          <div>
            <h1 className="text-4xl md:text-6xl font-black tracking-tight">{title}</h1>
            <p className="mt-2 text-white/60 text-sm">{count} {type === "artists" ? "artistes" : type === "tracks" ? "titres" : "albums"}</p>
          </div>
        </div>
      </div>

      <div className="px-8 pb-24">
        {type === "albums" && (
          <>
            {albums.length === 0 ? (
              <p className="text-white/60">Aucun album à afficher.</p>
            ) : (
              <div className="grid gap-6 [grid-template-columns:repeat(auto-fill,minmax(180px,1fr))]">
                {albums.map((a, idx) => {
                  const x = normalizeAlbum(a, idx);
                  return (
                    <button
                      key={x.id || idx}
                      type="button"
                      onClick={() => navigate(`/album/${encodeURIComponent(String(x.id))}`, { state: { album: x.raw } })}
                      className="group text-left rounded-2xl bg-white/5 hover:bg-white/10 transition p-4"
                    >
                      <div className="aspect-square rounded-xl overflow-hidden bg-black/30">
                        {x.img ? (
                          <img src={x.img} alt={x.name} className="h-full w-full object-cover group-hover:scale-[1.02] transition" />
                        ) : (
                          <div className="h-full w-full grid place-items-center text-3xl">🎵</div>
                        )}
                      </div>

                      <div className="mt-3">
                        <div className="font-semibold truncate">{x.name}</div>
                        <div className="text-xs text-white/60 truncate">{x.artist}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </>
        )}

        {type === "artists" && (
          <>
            {artists.length === 0 ? (
              <p className="text-white/60">Aucun artiste à afficher.</p>
            ) : (
              <div className="grid gap-6 [grid-template-columns:repeat(auto-fill,minmax(180px,1fr))]">
                {artists.map((a, idx) => {
                  const x = normalizeArtist(a, idx);
                  return (
                    <button
                      key={x.id || idx}
                      type="button"
                      onClick={() => navigate(`/artist/${encodeURIComponent(String(x.id))}`)}
                      className="group text-left rounded-2xl bg-white/5 hover:bg-white/10 transition p-4"
                    >
                      <div className="aspect-square rounded-full overflow-hidden bg-black/30">
                        {x.img ? (
                          <img src={x.img} alt={x.name} className="h-full w-full object-cover group-hover:scale-[1.02] transition" />
                        ) : (
                          <div className="h-full w-full grid place-items-center text-5xl font-black">
                            {x.name?.charAt(0) || "A"}
                          </div>
                        )}
                      </div>

                      <div className="mt-3">
                        <div className="font-semibold truncate">{x.name}</div>
                        <div className="text-xs text-white/60 truncate">Voir les titres</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </>
        )}

        {type === "tracks" && (
          <>
            {tracks.length === 0 ? (
              <p className="text-white/60">Aucun titre à afficher.</p>
            ) : (
              <div className="grid gap-6 [grid-template-columns:repeat(auto-fill,minmax(180px,1fr))]">
                {tracks.map((t, idx) => {
                  const x = normalizeTrack(t, idx);
                  return (
                    <div key={x.id || idx} className="rounded-2xl bg-white/5 hover:bg-white/10 transition p-4">
                      <div className="aspect-square rounded-xl overflow-hidden bg-black/30">
                        {x.img ? (
                          <img src={x.img} alt={x.title} className="h-full w-full object-cover" />
                        ) : (
                          <div className="h-full w-full grid place-items-center text-3xl">🎧</div>
                        )}
                      </div>

                      <div className="mt-3">
                        <div className="font-semibold truncate">{x.title}</div>
                        <div className="text-xs text-white/60 truncate">{x.artist}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
