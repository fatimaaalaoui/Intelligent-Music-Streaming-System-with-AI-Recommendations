# ml/train_item_item.py
import os
from datetime import datetime
from typing import Dict, List, Tuple

import numpy as np
from scipy.sparse import coo_matrix
from sklearn.metrics.pairwise import cosine_similarity

from common import (
    get_db,
    ensure_ml_indexes,
    load_listens_grouped,
    get_listened_track_ids,
    get_disliked_track_ids,
    get_available_track_ids,
    save_recos,
)

TYPE = "item_item"


def main():
    client, db = get_db()
    ensure_ml_indexes(db)

    rows = load_listens_grouped(db)
    users = sorted({u for u, _, _ in rows if u})
    items = sorted({t for _, t, _ in rows if t})

    skipped = sum(1 for u, t, _ in rows if not u or not t)
    print("users loaded:", len(users), "skipped:", skipped)
    print("items:", len(items))

    if not users or not items:
        print("❌ Not enough data.")
        return

    user_to_i = {u: i for i, u in enumerate(users)}
    item_to_j = {t: j for j, t in enumerate(items)}

    ui = np.array([user_to_i[u] for u, t, _ in rows if u and t], dtype=np.int32)
    ij = np.array([item_to_j[t] for u, t, _ in rows if u and t], dtype=np.int32)
    vv = np.array([w for u, t, w in rows if u and t], dtype=np.float32)

    R = coo_matrix((vv, (ui, ij)), shape=(len(users), len(items))).tocsr()

    # Item vectors = columns, so build item-user matrix
    I = R.T  # shape items x users

    # Compute cosine similarity between items
    sim = cosine_similarity(I, dense_output=False)  # sparse output ok
    print("neighbors built")

    topN = int(os.getenv("ITEM_ITEM_TOPN", "50"))
    k_neighbors = int(os.getenv("ITEM_ITEM_NEIGHBORS", "50"))
    available = get_available_track_ids(db, set(items))

    # For each user: score candidates by sum(sim(item_listened, candidate))
    for u in users:
        listened = list(get_listened_track_ids(db, u))
        disliked = get_disliked_track_ids(db, u)

        listened = [x for x in listened if x in item_to_j]
        if not listened:
            # no history -> skip (hybrid will fallback)
            save_recos(db, u, TYPE, [], [], meta={"note": "no_history"})
            continue

        listened_idx = [item_to_j[x] for x in listened]

        # Sum similarities from listened items
        scores = np.zeros(len(items), dtype=np.float64)
        for li in listened_idx:
            row = sim.getrow(li) if hasattr(sim, "getrow") else sim[li]
            if hasattr(row, "tocoo"):
                coo = row.tocoo()
                for j, v in zip(coo.col, coo.data):
                    scores[j] += float(v)
            else:
                scores += row

        # Remove self + listened + disliked + noaudio
        bad = set(listened) | set(disliked) | (set(items) - available)

        cand = []
        for j, tid in enumerate(items):
            if tid in bad:
                continue
            cand.append((tid, float(scores[j])))

        cand.sort(key=lambda x: x[1], reverse=True)
        recs = cand[:topN]

        track_ids = [t for t, _ in recs]
        sc = [s for _, s in recs]

        save_recos(
            db,
            user_id=u,
            rec_type=TYPE,
            track_ids=track_ids,
            scores=sc,
            meta={"neighbors": k_neighbors, "model": "cosine_item_item", "generatedAt": datetime.utcnow().isoformat()},
        )

    print("OK: item_item recommendations created/updated.")
    client.close()


if __name__ == "__main__":
    main()
