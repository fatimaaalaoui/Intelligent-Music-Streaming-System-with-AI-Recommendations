export default function ArtistBubbleCard({ artist, onClick }) {
  return (
    <div className="group w-[170px] shrink-0 cursor-pointer" onClick={onClick}>
      <div
        className="rounded-xl bg-transparent
                   group-hover:bg-[#181818]
                   group-hover:shadow-lg
                   transition-all duration-200
                   p-4 flex flex-col items-center"
      >
        <div className="relative mb-3">
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

          <button
            type="button"
            className="absolute bottom-4 right-4 opacity-0
                       group-hover:opacity-100 group-hover:translate-y-[-4px]
                       transition-all duration-200
                       h-11 w-11 rounded-full bg-[#1babd3]
                       grid place-items-center shadow-xl"
            onClick={(e) => e.preventDefault()}
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
