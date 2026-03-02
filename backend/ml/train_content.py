# ml/train_content.py
import os
from datetime import datetime, timezone

import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

from common import (
    get_db,
    ensure_ml_indexes,
    get_listened_track_ids,
    get_disliked_track_ids,
    get_available_track_ids,
    save_recos,
)

TYPE = "content"


def track_to_text(t: dict) -> str:
    title = (t.get("title") or "").strip()
    main_genre = (t.get("mainGenre") or "").strip()

    tags = t.get("tags") or []
    if isinstance(tags, list):
        tags = " ".join(str(x) for x in tags)
    else:
        tags = str(tags)

    artist = str(t.get("artistId") or "")
    album = str(t.get("albumId") or "")

    return f"{title} {main_genre} {tags} artist_{artist} album_{album}"


def main():
    client, db = get_db()
    ensure_ml_indexes(db)

    tracks = list(
        db["tracks"].find(
            {},
            {
                "_id": 1,
                "title": 1,
                "tags": 1,
                "mainGenre": 1,
                "artistId": 1,
                "albumId": 1,
                "audioUrl": 1,
                "audio": 1,
                "src": 1,
            },
        )
    )
    print("tracks for content model:", len(tracks))
    if not tracks:
        print("❌ No tracks.")
        return

    track_ids = [str(t["_id"]) for t in tracks]
    texts = [track_to_text(t) for t in tracks]

    vectorizer = TfidfVectorizer(
        max_features=int(os.getenv("CONTENT_MAX_FEATURES", "5000")),
        ngram_range=(1, 2),
        min_df=1,
    )
    X = vectorizer.fit_transform(texts)  # sparse (n_tracks x n_features)

    users = db["listening_history"].distinct("userId")
    users = [str(u) for u in users if u]
    print("users loaded:", len(users))

    topN = int(os.getenv("CONTENT_TOPN", "50"))
    available = get_available_track_ids(db, set(track_ids))

    # index rapide: trackId -> row index
    idx_map = {tid: i for i, tid in enumerate(track_ids)}

    for u in users:
        listened = list(get_listened_track_ids(db, u))
        disliked = get_disliked_track_ids(db, u)

        listened_idxs = [idx_map[tid] for tid in listened if tid in idx_map]
        if not listened_idxs:
            save_recos(db, u, TYPE, [], [], meta={"note": "no_history"})
            continue

        # ✅ IMPORTANT: convert mean to ndarray (cosine_similarity doesn't accept np.matrix)
        prof = X[listened_idxs].mean(axis=0)
        prof = np.asarray(prof)  # converts np.matrix -> ndarray
        if prof.ndim == 1:
            prof = prof.reshape(1, -1)

        scores = cosine_similarity(prof, X).ravel().astype(np.float64)

        bad = set(listened) | set(disliked) | (set(track_ids) - available)

        cand = []
        for i, tid in enumerate(track_ids):
            if tid in bad:
                continue
            cand.append((tid, float(scores[i])))

        cand.sort(key=lambda x: x[1], reverse=True)
        recs = cand[:topN]

        save_recos(
            db,
            user_id=u,
            rec_type=TYPE,
            track_ids=[t for t, _ in recs],
            scores=[s for _, s in recs],
            meta={"model": "tfidf_cosine", "generatedAt": datetime.now(timezone.utc).isoformat()},
        )

    print("OK: content recommendations created/updated.")
    client.close()


if __name__ == "__main__":
    main()
