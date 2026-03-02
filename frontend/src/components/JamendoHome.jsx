// src/components/JamendoHome.jsx
import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";


export default function JamendoHome({ onPlayTrack }) {
  const [albums, setAlbums] = useState([]);
  const [topTracks, setTopTracks] = useState([]);
  const [popularArtists, setPopularArtists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);
  const navigate = useNavigate();
  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        setErr(null);

        // 🔹 3 requêtes en parallèle (albums, top tracks, artistes)
        const [resAlbums, resTop, resArtists] = await Promise.all([
          fetch("http://localhost:5000/api/albums?limit=80"),
          fetch("http://localhost:5000/api/reco/top"),
          fetch("http://localhost:5000/api/artists?limit=200"),
        ]);

        if (!resAlbums.ok) throw new Error("API albums: " + resAlbums.status);
        if (!resTop.ok) throw new Error("API reco/top: " + resTop.status);
        if (!resArtists.ok)
          throw new Error("API artists: " + resArtists.status);

        const [albumsJson, topJson, artistsJson] = await Promise.all([
          resAlbums.json(),
          resTop.json(),
          resArtists.json(),
        ]);

        setAlbums(albumsJson);
        setTopTracks(topJson);
        setPopularArtists(artistsJson);
      } catch (e) {
        console.error(e);
        setErr(
          e.message === "Failed to fetch"
            ? "Impossible de contacter le backend (http://localhost:5000)."
            : e.message || "Erreur lors du chargement."
        );
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  const trendingTracks = topTracks.slice(0, 15);
  const albumsPopular = albums.slice(0, 15);
  const albumsRadio = albums.slice(15, 30);
  const albumsCharts = albums.slice(30, 45);

  return (
    <div className="w-full h-full flex flex-col bg-[#05070d]">
      <div className="mx-auto max-w-[1400px] w-full px-8 pb-24 pt-8 space-y-10">
        {loading && (
          <p className="text-sm text-white/60">Chargement des données…</p>
        )}
        {err && <p className="text-sm text-red-400">Erreur : {err}</p>}

        {!loading && !err && (
          <>
            {/* TITRES TENDANCE */}
            {trendingTracks.length > 0 && (
            <Section
    title="Titres tendance"
    actionLabel="Tout afficher"
    description="Les morceaux Jamendo les plus écoutés."
    seeAllData={{
      title: "Titres tendance",
      tracks: trendingTracks,
      type: "tracks",
    }}
  >
    <ScrollRow itemCount={trendingTracks.length}>
      {trendingTracks.map((track) => (
        <TrackCard
          key={track._id}
          track={track}
          playlist={trendingTracks}   
          onPlayTrack={onPlayTrack}
        />
      ))}
    </ScrollRow>
  </Section>
)}

            {/* ALBUMS POPULAIRES */}
            {albumsPopular.length > 0 && (
              <Section
                title="Albums et singles populaires"
                actionLabel="Tout afficher"
                description="Sélection d'albums issus de ta base Jamendo."
                seeAllData={{
                  title: "Albums et singles populaires",
                  albums: albumsPopular,
                }}
              >
                <ScrollRow itemCount={albumsPopular.length}>
                  {albumsPopular.map((album) => (
                    <AlbumCard key={album._id} album={album} />
                  ))}
                </ScrollRow>
              </Section>
            )}

            {/* ARTISTES POPULAIRES */}
            {popularArtists.length > 0 && (
              <Section
                title="Artistes populaires"
                actionLabel="Tout afficher"
                description="Artistes les plus présents dans ta base Jamendo."
                seeAllData={{
                  title: "Artistes populaires",
                  type: "artists",
                   artists: popularArtists,
                      // 👈 on envoie tous les artistes
                }}
              >
                <ScrollRow itemCount={popularArtists.length}>
                  {popularArtists.map((artist) => (
                    <ArtistBubbleCard key={artist._id} artist={artist} onClick={() => navigate(`/artist/${artist._id}`)} />
                  ))}
                </ScrollRow>
              </Section>
            )}

            {/* RADIO POPULAIRE */}
            {albumsRadio.length > 0 && (
              <Section
                title="Radio populaire"
                actionLabel="Tout afficher"
                description="Mix d'albums similaires pour découvrir de nouveaux titres."
                seeAllData={{
                  title: "Radio populaire",
                  albums: albumsRadio,
                }}
              >
                <ScrollRow itemCount={albumsRadio.length}>
                  {albumsRadio.map((album) => (
                    <AlbumCard key={album._id} album={album} />
                  ))}
                </ScrollRow>
              </Section>
            )}

            {/* CLASSEMENTS RECOMMANDÉS */}
            {albumsCharts.length > 0 && (
              <Section
                title="Classements recommandés"
                actionLabel="Tout afficher"
                description="Playlists inspirées des charts avec tes albums Jamendo."
                seeAllData={{
                  title: "Classements recommandés",
                  albums: albumsCharts,
                }}
              >
                <ScrollRow itemCount={albumsCharts.length}>
                  {albumsCharts.map((album) => (
                    <AlbumCard key={album._id} album={album} />
                  ))}
                </ScrollRow>
              </Section>
            )}
          </>
        )}
      </div>
    </div>
  );
}

/* ---------- Section titre + sous-titre ---------- */

function Section({ title, description, actionLabel, seeAllData, children }) {
  return (
    <section className="space-y-4">
      <div className="flex items-baseline justify-between gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-white">
            {title}
          </h2>
          {description && (
            <p className="text-sm text-white/60 mt-1">{description}</p>
          )}
        </div>

        {/* bouton "Tout afficher" → devient un Link vers /see-all */}
        {actionLabel && seeAllData && (
          <Link
            to="/see-all"
            state={seeAllData} // { title, albums }
            className="text-xs md:text-sm font-semibold text-white/70 hover:text-white"
          >
            {actionLabel}
          </Link>
        )}

        {/* si tu veux garder un bouton simple quand il n'y a pas de seeAllData */}
        {actionLabel && !seeAllData && (
          <button className="text-xs md:text-sm font-semibold text-white/70 hover:text-white">
            {actionLabel}
          </button>
        )}
      </div>

      {children}
    </section>
  );
}

/* ---------- Rangée scrollable ---------- */

function ScrollRow({ children, itemCount }) {
  const rowRef = useRef(null);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(false);

  const updateButtons = () => {
    const el = rowRef.current;
    if (!el) return;
    const { scrollLeft, clientWidth, scrollWidth } = el;
    setCanLeft(scrollLeft > 5);
    setCanRight(scrollLeft + clientWidth < scrollWidth - 5);
  };

  useEffect(() => {
    const el = rowRef.current;
    if (!el) return;
    updateButtons();

    const onScroll = () => updateButtons();
    const onResize = () => updateButtons();

    el.addEventListener("scroll", onScroll);
    window.addEventListener("resize", onResize);

    return () => {
      el.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
    };
  }, [itemCount]);

  const scrollByAmount = (direction) => {
    const el = rowRef.current;
    if (!el) return;
    const scrollAmount = 420 * direction;
    el.scrollBy({ left: scrollAmount, behavior: "smooth" });
    setTimeout(updateButtons, 350);
  };

  return (
    <div className="relative">
      {/* flèche gauche */}
      <button
        type="button"
        onClick={() => scrollByAmount(-1)}
        className={`hidden md:flex items-center justify-center
                    absolute left-3 top-1/2 -translate-y-1/2 z-10
                    h-9 w-9 rounded-full bg-black/60 hover:bg-black
                    text-white shadow-lg transition-opacity ${
                      canLeft ? "opacity-100" : "opacity-0 pointer-events-none"
                    }`}
        aria-label="Précédent"
      >
        <svg viewBox="0 0 24 24" className="h-5 w-5">
          <path
            d="M15.41 7.41 14 6l-6 6 6 6 1.41-1.41L10.83 12z"
            fill="currentColor"
          />
        </svg>
      </button>

      {/* flèche droite */}
      <button
        type="button"
        onClick={() => scrollByAmount(1)}
        className={`hidden md:flex items-center justify-center
                    absolute right-3 top-1/2 -translate-y-1/2 z-10
                    h-9 w-9 rounded-full bg-black/60 hover:bg-black
                    text-white shadow-lg transition-opacity ${
                      canRight ? "opacity-100" : "opacity-0 pointer-events-none"
                    }`}
        aria-label="Suivant"
      >
        <svg viewBox="0 0 24 24" className="h-5 w-5">
          <path
            d="M8.59 16.59 10 18l6-6-6-6-1.41 1.41L13.17 12z"
            fill="currentColor"
          />
        </svg>
      </button>

      <div className="overflow-hidden">
        <div
          ref={rowRef}
          className="flex gap-8 overflow-x-auto pb-2"
          style={{ scrollbarWidth: "none" }}
        >
          <style>
            {`
              div::-webkit-scrollbar { display: none; }
            `}
          </style>
          {children}
        </div>
      </div>
    </div>
  );
}

/* ---------- Cartes ---------- */

function TrackCard({ track, onPlayTrack, playlist }) {
  const handlePlay = () => {
    if (!onPlayTrack) return;

    // playlist normalisée à partir de la liste fournie
    const normalizedList = (playlist && playlist.length ? playlist : [track]).map((t) => ({
      id: t._id || t.id || t.audioUrl,
      title: t.title,
      artist: t.artistName || "Artiste Jamendo",
      cover: t.image,
      src: t.audioUrl,
    }));

    const id = track._id || track.id || track.audioUrl;
    const current =
      normalizedList.find((nt) => nt.id === id) || normalizedList[0];

    onPlayTrack(current, normalizedList);
  };
  return (
    <button
      type="button"
      onClick={handlePlay}
      className="group w-[210px] shrink-0 text-left cursor-pointer"
    >
      {/* carte entière avec fond + ombre au hover */}
      <div
        className="rounded-xl bg-transparent
                   group-hover:bg-[#181818]
                   group-hover:shadow-lg
                   transition-all duration-200 p-3"
      >
        <div className="relative mb-3 rounded-md overflow-hidden">
          <img
            src={track.image}
            alt={track.title}
            className="w-full aspect-square object-cover
                       transition-transform duration-200
                       group-hover:scale-105"
          />
          <span
            className="absolute bottom-4 right-4 opacity-0
                       group-hover:opacity-100 group-hover:translate-y-[-4px]
                       transition-all duration-200
                       h-11 w-11 rounded-full bg-[#1babd3]
                       grid place-items-center shadow-xl"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5 fill-black">
              <path d="M8 5v14l11-7z" />
            </svg>
          </span>
        </div>

        {/* ces textes sont maintenant dans la carte → l’ombre les inclut */}
        <p className="truncate font-semibold text-white text-sm">
          {track.title}
        </p>
        <p className="truncate text-xs text-white/60 mt-1">
          {track.artistName || "Artiste Jamendo"}
        </p>
      </div>
    </button>
  );
}


function ArtistBubbleCard({ artist, onClick }) {
  return (
    <div className="group w-[170px] shrink-0 cursor-pointer"
    onClick={onClick}
    >
      {/* carte comme pour les albums */}
      <div
        className="rounded-xl bg-transparent
                   group-hover:bg-[#181818]
                   group-hover:shadow-lg
                   transition-all duration-200
                   p-4 flex flex-col items-center"
      >
        <div className="relative mb-3">
          {/* image ronde */}
          <div className="h-[140px] w-[140px] rounded-full overflow-hidden bg-[#181818]">
            {artist.image ? (
              <img
                src={artist.image}
                alt={artist.name}
                className="h-full w-full object-cover
                           group-hover:scale-105 transition-transform duration-200"
              />
            ) : (
              <div className="h-full w-full grid place-items-center text-xs text-white/60">
                {artist.name?.charAt(0) || "?"}
              </div>
            )}
          </div>

          {/* petit bouton Play vert */}
          <button
            type="button"
            className="absolute bottom-4 right-4 opacity-0
                       group-hover:opacity-100 group-hover:translate-y-[-4px]
                       transition-all duration-200
                       h-11 w-11 rounded-full bg-[#1babd3]
                       grid place-items-center shadow-xl"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5 fill-black ml-0.5">
              <path d="M8 5v14l11-7z" />
            </svg>
          </button>
        </div>

        <p className="truncate font-semibold text-white text-sm text-center">
          {artist.name}
        </p>
        <p className="text-xs text-white/60 mt-1 text-center">Artiste</p>
      </div>
    </div>
  );
}

function AlbumCard({ album }) {
  // lien vers la page album
  return (
    <Link
      to={`/album/${album._id}`}
      state={{ album }}
      className="group w-[210px] shrink-0 cursor-pointer"
    >
      <div
        className="rounded-xl bg-transparent
                   group-hover:bg-[#181818]
                   transition-colors duration-200 p-3"
      >
        <div className="relative mb-3 rounded-md overflow-hidden">
          <img
            src={album.image}
            alt={album.title}
            className="w-full aspect-square object-cover
                       transition-transform duration-200
                       group-hover:scale-105"
          />

          <button
            type="button"
            className="absolute bottom-4 right-4 opacity-0
                       group-hover:opacity-100 group-hover:translate-y-[-4px]
                       transition-all duration-200
                       h-11 w-11 rounded-full bg-[#1babd3]
                       grid place-items-center shadow-xl"
          >
            <svg viewBox="0 0 24 24" className="h-6 w-6 fill-black ml-0.5">
              <path d="M8 5v14l11-7z" />
            </svg>
          </button>
        </div>

        <p className="truncate font-semibold text-white text-sm">
          {album.title}
        </p>
        {album.artistName && (
          <p className="truncate text-xs text-white/60 mt-1">
            {album.artistName}
          </p>
        )}
      </div>
    </Link>
  );
}
