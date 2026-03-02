# ml/train_svd.py
import os
from datetime import datetime
from typing import Dict, List, Tuple

import numpy as np
from scipy.sparse import coo_matrix
from scipy.sparse.linalg import svds

from common import (
    get_db,
    ensure_ml_indexes,
    load_listens_grouped,
    get_listened_track_ids,
    get_disliked_track_ids,
    get_available_track_ids,
    save_recos,
)

TYPE = "svd"


def main():
    client, db = get_db()
    ensure_ml_indexes(db)

    rows = load_listens_grouped(db)
    skipped = 0
    clean = []
    for u, t, w in rows:
        if not u or not t:
            skipped += 1
            continue
        clean.append((u, t, w))

    print("listens skipped (missing userId/trackId):", skipped)
    print("rows before groupby:", len(clean))

    if not clean:
        print("❌ No listens found.")
        return

    users = sorted({u for u, _, _ in clean})
    items = sorted({t for _, t, _ in clean})

    user_to_i = {u: i for i, u in enumerate(users)}
    item_to_j = {t: j for j, t in enumerate(items)}

    ui = np.array([user_to_i[u] for u, _, _ in clean], dtype=np.int32)
    ij = np.array([item_to_j[t] for _, t, _ in clean], dtype=np.int32)
    vv = np.array([w for _, _, w in clean], dtype=np.float32)

    n_users = len(users)
    n_items = len(items)

    R = coo_matrix((vv, (ui, ij)), shape=(n_users, n_items)).tocsr()

    k_req = int(os.getenv("SVD_K", "20"))
    k = min(k_req, min(n_users, n_items) - 1)
    if k < 1:
        print("⚠️ Matrix too small for SVD, skipping.")
        return

    print(f"Training SVD with k = {k} shape = ({n_users}, {n_items})")

    # Compute SVD
    U, s, Vt = svds(R.astype(np.float32), k=k)
    # Sort by descending singular values
    idx = np.argsort(-s)
    s = s[idx]
    U = U[:, idx]
    Vt = Vt[idx, :]

    # Precompute all predicted scores
    S = np.diag(s)
    P = U @ S @ Vt  # shape users x items

    all_item_ids = np.array(items, dtype=object)
    available = get_available_track_ids(db, set(items))

    topN = int(os.getenv("SVD_TOPN", "50"))

    for u in users:
        i = user_to_i[u]
        scores = P[i, :].astype(np.float64)

        listened = get_listened_track_ids(db, u)
        disliked = get_disliked_track_ids(db, u)

        mask_bad = set(listened) | set(disliked)
        # filter non-audio
        mask_bad |= (set(items) - available)

        cand = []
        for j, tid in enumerate(items):
            if tid in mask_bad:
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
            meta={"k": k, "model": "svds", "generatedAt": datetime.utcnow().isoformat()},
        )

    print("OK: ml_recommendations créée/maj.")
    client.close()


if __name__ == "__main__":
    main()
