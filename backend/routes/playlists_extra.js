const express = require("express");
const router = express.Router();
const { ObjectId } = require("mongodb");

// ✅ Helper: récupère db depuis app.locals.db (défini dans server.js)
const getDb = (req) => req.app.locals.db;

// ---------- Helpers cover ----------
const esc = (s = "") =>
  String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

const hashHue = (str = "") => {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = str.charCodeAt(i) + ((h << 5) - h);
  return Math.abs(h) % 360;
};

function makeSvgCover({ title = "Playlist", subtitle = "", seed = "" }) {
  const hue = hashHue(seed || title);
  const hue2 = (hue + 60) % 360;

  const t = esc(title);
  const sub = esc(subtitle);

  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="800" height="800" viewBox="0 0 800 800">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="hsl(${hue} 85% 55%)"/>
      <stop offset="100%" stop-color="hsl(${hue2} 85% 55%)"/>
    </linearGradient>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="18" stdDeviation="18" flood-color="rgba(0,0,0,.35)"/>
    </filter>
  </defs>

  <rect width="800" height="800" rx="56" fill="url(#g)"/>
  <circle cx="640" cy="140" r="190" fill="rgba(255,255,255,.10)"/>
  <circle cx="140" cy="640" r="220" fill="rgba(0,0,0,.12)"/>

  <g filter="url(#shadow)">
    <rect x="90" y="430" width="620" height="240" rx="36" fill="rgba(0,0,0,.20)"/>
  </g>

  <text x="120" y="520" font-family="system-ui, -apple-system, Segoe UI, Roboto, Arial" font-size="54" font-weight="800" fill="white">
    ${t}
  </text>
  <text x="120" y="585" font-family="system-ui, -apple-system, Segoe UI, Roboto, Arial" font-size="26" font-weight="600" fill="rgba(255,255,255,.85)">
    ${sub}
  </text>

  <g transform="translate(120,170)">
    <circle cx="0" cy="0" r="72" fill="rgba(255,255,255,.18)"/>
    <path d="M-18 -28v56l48-28z" fill="rgba(255,255,255,.92)"/>
  </g>
</svg>`.trim();

  const encoded = encodeURIComponent(svg)
    .replaceAll("%0A", "")
    .replaceAll("%20", " ")
    .replaceAll("%3D", "=")
    .replaceAll("%3A", ":")
    .replaceAll("%2F", "/");

  return `data:image/svg+xml;charset=utf-8,${encoded}`;
}

// ✅ Ping (debug)
router.get("/playlists/_ping", (req, res) => res.json({ ok: true }));

// ✅ GET playlists of user
router.get("/users/:userId/playlists", async (req, res) => {
  try {
    const db = getDb(req);
    const userId = String(req.params.userId);

    const playlists = await db
      .collection("playlists")
      .find({ userId })
      .sort({ createdAt: -1 })
      .toArray();

    res.json(playlists);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to fetch playlists" });
  }
});

// ✅ POST create playlist
router.post("/playlists/:id/tracks", async (req, res) => {
  const db = getDb(req);
  const { id } = req.params;
  const { trackId } = req.body;

  if (!trackId) return res.status(400).json({ error: "trackId requis" });

  const track = await db.collection("tracks").findOne({ _id: String(trackId) });
  if (!track) return res.status(404).json({ error: "Track introuvable" });

  const playlist = await db.collection("playlists").findOne({ _id: new ObjectId(id) });
  if (!playlist) return res.status(404).json({ error: "Playlist introuvable" });

  const exists = (playlist.tracks || []).some(t => String(t._id) === String(trackId));
  if (exists) return res.json(playlist);

  const updated = await db.collection("playlists").findOneAndUpdate(
    { _id: new ObjectId(id) },
    { $push: { tracks: track }, $set: { updatedAt: new Date() } },
    { returnDocument: "after" }
  );

  res.json(updated.value);
});


// ✅ GET playlist by id
router.get("/playlists/:id", async (req, res) => {
  try {
    const db = getDb(req);
    const { id } = req.params;

    const pl = await db.collection("playlists").findOne({ _id: new ObjectId(id) });
    if (!pl) return res.status(404).json({ error: "Playlist not found" });

    res.json(pl);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to read playlist" });
  }
});

// ✅ PATCH rename playlist
// ✅ PATCH rename playlist
router.patch("/playlists/:id", async (req, res) => {
  try {
    const db = getDb(req);
    const { id } = req.params;
    const { name, image, coverUrl } = req.body || {};

    const $set = { updatedAt: new Date() };
    if (typeof name === "string" && name.trim()) $set.name = name.trim();
    if (typeof image === "string") $set.image = image;
    if (typeof coverUrl === "string") $set.coverUrl = coverUrl;

    const filter = ObjectId.isValid(id)
      ? { $or: [{ _id: new ObjectId(id) }, { _id: String(id) }] }
      : { _id: String(id) };

    const r = await db.collection("playlists").findOneAndUpdate(
      filter,
      { $set },
      { returnDocument: "after" }
    );

    if (!r.value) return res.status(404).json({ error: "Playlist not found" });
    res.json(r.value);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to update playlist" });
  }
});


// ✅ POST add track to playlist
// ✅ POST add track to playlist (ACCEPTE track OU trackId)



// ✅ DELETE playlist
router.delete("/playlists/:id", async (req, res) => {
  try {
    const db = getDb(req);
    const { id } = req.params;

    const r = await db.collection("playlists").deleteOne({ _id: new ObjectId(id) });
    if (!r.deletedCount) return res.status(404).json({ error: "Playlist not found" });

    res.json({ ok: true, id });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to delete playlist" });
  }
});

// ✅ POST generate cover
// ✅ POST add track to playlist  (ACCEPTE track OU trackId)



module.exports = router;
