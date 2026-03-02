export default function TrackCard({ track, onPlayTrack, playlist }) {
  const handlePlay = () => {
    if (!onPlayTrack) return;

    const normalizedList = (playlist && playlist.length ? playlist : [track]).map((t) => ({
      id: t._id || t.id, // ✅ IMPORTANT: PAS audioUrl
      title: t.title,
      artist: t.artistName || t.artist || "Artiste Jamendo",
      cover: t.image || t.cover,
      src: t.audioUrl || t.src, // ✅ audio
    }));

    const id = track._id || track.id; // ✅ IMPORTANT: PAS audioUrl
    const current = normalizedList.find((nt) => nt.id === id) || normalizedList[0];

    onPlayTrack(current, normalizedList);
  };

  return (
    <button
      type="button"
      onClick={handlePlay}
      className="group w-[210px] shrink-0 text-left cursor-pointer"
    >
      <div
        className="rounded-xl bg-transparent
                   group-hover:bg-[#181818]
                   group-hover:shadow-lg
                   transition-all duration-200 p-3"
      >
        <div className="relative mb-3 rounded-md overflow-hidden">
          {track.image ? (
            <img
              src={track.image}
              alt={track.title}
              className="w-full h-[180px] object-cover
                         group-hover:scale-105 transition-transform duration-200"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-[180px] bg-white/10" />
          )}

          <span
            className="absolute bottom-3 right-3 opacity-0
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

        <p className="truncate font-semibold text-white text-sm">{track.title}</p>
        <p className="truncate text-xs text-white/60 mt-1">
          {track.artistName || "Artiste Jamendo"}
        </p>
      </div>
    </button>
  );
}
