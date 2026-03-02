import { Link } from "react-router-dom";

export default function ArtistsGrid({ artists = [] }) {
  if (!artists.length) {
    return <p className="py-6 text-sm text-white/60">Aucun artiste trouvé.</p>;
  }

  return (
    <section className="mt-8">
      <div className="flex items-end justify-between">
        <h2 className="text-4xl font-black tracking-tight">Artistes</h2>
        <span className="text-sm text-white/60">{artists.length} au total</span>
      </div>

      <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-6">
        {artists.map((a) => (
          <Link
            key={a.id}
            to={`/artist/${a.id}`}
            className="group rounded-2xl bg-white/5 hover:bg-white/10 ring-1 ring-white/10 hover:ring-white/20 transition p-4 text-left"
          >
            <div className="h-24 w-24 rounded-full overflow-hidden bg-white/10 mx-auto">
              {a.image ? (
                <img src={a.image} alt={a.name} className="h-full w-full object-cover" loading="lazy" />
              ) : (
                <div className="h-full w-full grid place-items-center text-2xl font-black text-white/80">
                  {a.name?.charAt(0)?.toUpperCase()}
                </div>
              )}
            </div>

            <p className="mt-3 truncate text-sm font-semibold text-white">{a.name}</p>
            <p className="truncate text-xs text-white/60">Artiste</p>
          </Link>
        ))}
      </div>
    </section>
  );
}
