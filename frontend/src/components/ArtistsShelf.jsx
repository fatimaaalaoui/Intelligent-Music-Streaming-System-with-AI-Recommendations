import { Link } from "react-router-dom";

export default function ArtistsShelf({ artists = [], limit = 12, onShowAll }) {
  const list = (artists || []).slice(0, limit);

  return (
    <section className="mt-10">
      <div className="flex items-end justify-between">
        <div>
          <h2 className="text-4xl font-black tracking-tight">Artistes populaires</h2>
          <p className="mt-1 text-sm text-white/60">
            Artistes les plus présents dans ta base Jamendo.
          </p>
        </div>

        <button
          type="button"
          onClick={() => onShowAll?.()}
          className="text-sm text-white/70 hover:text-white"
        >
          Tout afficher
        </button>
      </div>

      <div className="mt-6 flex gap-8 overflow-x-auto pb-4">
        {list.map((a) => (
          <Link
            key={a.id}
            to={`/artist/${a.id}`}
            className="group flex w-32 flex-col items-center text-left shrink-0"
          >
            <div className="h-28 w-28 rounded-full overflow-hidden bg-white/10 shadow-lg ring-1 ring-white/10 group-hover:ring-white/20 transition">
              {a.image ? (
                <img
                  src={a.image}
                  alt={a.name}
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
              ) : (
                <div className="h-full w-full grid place-items-center text-2xl font-black text-white/80">
                  {a.name?.charAt(0)?.toUpperCase()}
                </div>
              )}
            </div>

            <p className="mt-3 w-full truncate text-sm font-semibold text-white">{a.name}</p>
            <p className="w-full truncate text-xs text-white/60">Artiste</p>
          </Link>
        ))}
      </div>
    </section>
  );
}
