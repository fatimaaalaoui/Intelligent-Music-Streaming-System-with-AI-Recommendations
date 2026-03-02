import { useLocation, useNavigate } from "react-router-dom";
import ArtistBubbleCard from "./ArtistBubbleCard";
import TrackCard from "./TrackCard";
import { useMusic } from "./useMusic";

export default function SeeAll() {
  const location = useLocation();
  const navigate = useNavigate();
  const { playTrack } = useMusic();

  const state = location.state || {};
  const title = state.title || "Tout afficher";
  const type = state.type;

  const artists = state.artists || [];
  const tracks = state.tracks || state.albums || [];

  const onPlayTrack = (current) => {
    // ✅ historise + joue
    playTrack(current);
  };

  return (
    <div className="w-full h-full flex flex-col bg-[#05070d]">
      <div className="mx-auto max-w-[1400px] w-full px-8 pb-24 pt-8 space-y-10">
        <div className="flex items-baseline justify-between gap-4">
          <h1 className="text-2xl md:text-3xl font-bold text-white">{title}</h1>
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="text-xs md:text-sm font-semibold text-white/70 hover:text-white"
          >
            Retour
          </button>
        </div>

        {type === "artists" && (
          <div className="flex flex-wrap gap-8">
            {artists.map((a) => (
              <ArtistBubbleCard
                key={a._id || a.id}
                artist={{ _id: a._id || a.id, name: a.name, image: a.image }}
                onClick={() => navigate(`/artist/${a._id || a.id}`)}
              />
            ))}
          </div>
        )}

        {type === "tracks" && (
          <div className="flex flex-wrap gap-6">
            {tracks.map((t) => (
              <TrackCard
                key={t._id || t.id || t.audioUrl}
                track={t}
                onPlayTrack={onPlayTrack}
                playlist={[t]} // ✅ seulement la track sélectionnée
              />
            ))}
          </div>
        )}

        {type !== "artists" && type !== "tracks" && (
          <p className="text-sm text-white/60">
            Type non supporté: {String(type)}
          </p>
        )}
      </div>
    </div>
  );
}
