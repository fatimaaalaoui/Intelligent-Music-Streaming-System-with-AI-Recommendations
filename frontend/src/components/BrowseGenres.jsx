// src/components/BrowseGenres.jsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

const API = "http://localhost:5000/api";

function hashString(str = "") {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

// Couleur pastel (stable selon user + genre)
function pastelColor(userKey, key) {
  const seed = hashString(`${userKey}::${key}`);
  const hue = seed % 360;
  return `hsl(${hue} 55% 72%)`;
}

// Dégradé pastel (stable selon user + genre)
function pastelGradient(userKey, key) {
  const seed = hashString(`${userKey}::${key}`);
  const hue = seed % 360;
  const hue2 = (hue + 45) % 360;
  return `linear-gradient(135deg,
    hsl(${hue} 55% 72%) 0%,
    hsl(${hue2} 55% 70%) 55%,
    hsl(${hue} 55% 68%) 100%
  )`;
}

function titleCase(s = "") {
  const t = String(s).trim();
  if (!t) return "";
  return t.charAt(0).toUpperCase() + t.slice(1);
}

export default function BrowseGenres({ currentUser }) {
  const navigate = useNavigate();
  const userKey = String(currentUser?._id || currentUser?.id || "guest");

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [genres, setGenres] = useState([]);

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        setLoading(true);
        setErr("");

        // 1) ✅ Solution idéale : lister tous les genres via /api/genres
        const r = await fetch(`${API}/genres`);
        if (r.ok) {
          const json = await r.json();
          const list = Array.isArray(json) ? json : [];
          const cleaned = list
            .map((g) => String(g || "").trim())
            .filter(Boolean);

          // garde l'ordre alphabétique mais “TitleCase” pour l’affichage
          cleaned.sort((a, b) => a.localeCompare(b, "fr", { sensitivity: "base" }));

          if (!alive) return;
          setGenres(cleaned);
          return;
        }

        // 2) Fallback : si /api/genres n'existe pas encore, on déduit depuis les tracks
        const r2 = await fetch(`${API}/tracks?limit=500`);
        if (!r2.ok) throw new Error("API tracks: " + r2.status);
        const tracks = await r2.json();

        const set = new Set();
        if (Array.isArray(tracks)) {
          for (const t of tracks) {
            const g = String(t?.mainGenre || "").trim();
            if (g) set.add(g);
          }
        }

        const fallback = Array.from(set);
        fallback.sort((a, b) => a.localeCompare(b, "fr", { sensitivity: "base" }));

        if (!alive) return;
        setGenres(fallback);
      } catch (e) {
        if (!alive) return;
        setErr(e?.message || "Erreur chargement genres");
      } finally {
        if (!alive) return;
        setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  const cards = useMemo(() => {
    // pour afficher en TitleCase mais garder la valeur originale pour requêtes
    return genres.map((g) => ({
      raw: g,
      label: titleCase(g),
      letter: titleCase(g).charAt(0).toUpperCase(),
      bg: pastelGradient(userKey, `genre::${g}`),
      chip: pastelColor(userKey, `chip::${g}`),
    }));
  }, [genres, userKey]);

  return (
    <div className="min-h-screen w-full text-white bg-gradient-to-b from-[#0b0f2a] via-[#090b1a] to-black">
      <div className="px-6 md:px-10 py-8">
        <h1 className="text-4xl md:text-5xl font-extrabold">Tout parcourir</h1>
        <p className="text-white/70 mt-2">
          Choisis un genre, puis découvre des titres.
        </p>

        {loading ? (
          <div className="mt-10 text-white/70">Chargement...</div>
        ) : err ? (
          <div className="mt-10">
            <div className="text-red-300 font-semibold">Erreur</div>
            <div className="text-white/70 mt-1">{err}</div>
          </div>
        ) : cards.length === 0 ? (
          <div className="mt-10 text-white/70">Aucun genre trouvé.</div>
        ) : (
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {cards.map((c) => (
              <button
                key={c.raw}
                onClick={() => navigate(`/genre/${encodeURIComponent(c.raw)}`)}
                className="relative overflow-hidden rounded-3xl text-left shadow-[0_18px_60px_rgba(0,0,0,0.35)] border border-white/10"
                style={{ background: c.bg }}
              >
                <div className="p-6 md:p-7 flex items-center justify-between">
                  <div>
                    <div className="text-3xl md:text-4xl font-extrabold drop-shadow">
                      {c.label}
                    </div>
                    <div className="mt-2 text-black/60 font-semibold">
                      Genre
                    </div>
                  </div>

                  <div
                    className="w-20 h-20 rounded-2xl rotate-12 shadow-lg flex items-center justify-center"
                    style={{ background: c.chip }}
                    aria-hidden="true"
                  >
                    <span className="text-3xl font-black text-black/50">
                      {c.letter}
                    </span>
                  </div>
                </div>

                <div className="absolute inset-0 pointer-events-none opacity-20 bg-gradient-to-br from-white to-transparent" />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
