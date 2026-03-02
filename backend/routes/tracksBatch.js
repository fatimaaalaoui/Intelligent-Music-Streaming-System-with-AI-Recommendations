const express = require("express");
const router = express.Router();
const Track = require("../models/Track");

// POST /api/tracks/batch
// body: { ids: string[] }
router.post("/tracks/batch", async (req, res) => {
  try {
    const ids = Array.isArray(req.body.ids) ? req.body.ids : [];
    if (!ids.length) return res.json([]);

    const tracks = await Track.find({ _id: { $in: ids } }).lean();
    res.json(tracks);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "tracks_batch_failed" });
  }
});

module.exports = router;
