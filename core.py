"""EcoEar core: pure Python, no Streamlit. Used by api.py (and testable in Colab)."""
import functools
import json

import librosa
import numpy as np
import pandas as pd

SR = 16000
MAX_SECONDS = 180
HOP, WIN = 0.48, 0.96

ALERT_MAP = {
    "Chainsaw": "Chainsaw",
    "Gunshot, gunfire": "Gunshot",
    "Machine gun": "Gunshot",
    "Fusillade": "Gunshot",
}
SOUNDSCAPE = {
    "Birds": ["Bird", "Bird vocalization, bird call, bird song", "Chirp, tweet"],
    "Frogs": ["Frog", "Croak"],
    "Insects": ["Insect", "Cricket"],
    "Rain": ["Rain"],
    "Wind": ["Wind"],
}


@functools.lru_cache(maxsize=1)
def load_yamnet():
    import tensorflow_hub as hub
    model = hub.load("https://tfhub.dev/google/yamnet/1")
    names = pd.read_csv(model.class_map_path().numpy().decode("utf-8"))["display_name"].tolist()
    return model, names


@functools.lru_cache(maxsize=1)
def load_birdnet():
    try:
        from birdnetlib.analyzer import Analyzer
        return Analyzer()
    except Exception as e:
        print("BirdNET unavailable:", e)
        return None


def class_idx(names, wanted):
    return [i for i, n in enumerate(names) if n in wanted]


def to_events(hit, conf, label):
    out, start = [], None
    for i, h in enumerate(hit):
        if h and start is None:
            start = i
        if start is not None and (not h or i == len(hit) - 1):
            end = i if not h else i + 1
            out.append({
                "type": label,
                "start": round(start * HOP, 2),
                "end": round((end - 1) * HOP + WIN, 2),
                "confidence": round(float(conf[start:end].max()), 3),
            })
            start = None
    return out


def shannon(birds):
    if birds.empty:
        return 0.0
    p = birds["common_name"].value_counts(normalize=True)
    return float(-(p * np.log(p)).sum())


def spectrogram(y, max_cols=300):
    S = librosa.power_to_db(
        librosa.feature.melspectrogram(y=y, sr=SR, n_mels=64, fmax=8000), ref=np.max)
    t = librosa.frames_to_time(np.arange(S.shape[1]), sr=SR)
    f = librosa.mel_frequencies(n_mels=64, fmax=8000)
    if S.shape[1] > max_cols:
        idx = np.linspace(0, S.shape[1] - 1, max_cols).astype(int)
        S, t = S[:, idx], t[idx]
    return {"z": np.round(S, 1).tolist(), "t": np.round(t, 2).tolist(), "f": np.round(f, 0).tolist()}


def analyze_file(path, alert_thr=0.35, bird_conf=0.4):
    y, _ = librosa.load(path, sr=SR, mono=True, duration=MAX_SECONDS)
    model, names = load_yamnet()
    scores = model(y.astype(np.float32))[0].numpy()

    events = []
    for label in ("Chainsaw", "Gunshot"):
        ids = class_idx(names, [k for k, v in ALERT_MAP.items() if v == label])
        if ids:
            conf = scores[:, ids].max(axis=1)
            events += to_events(conf >= alert_thr, conf, label)

    activity = {}
    for cat, wanted in SOUNDSCAPE.items():
        ids = class_idx(names, wanted)
        activity[cat] = round(float((scores[:, ids].max(axis=1) > 0.3).mean()), 3) if ids else 0.0

    birds = pd.DataFrame()
    analyzer = load_birdnet()
    if analyzer is not None:
        from birdnetlib import Recording
        rec = Recording(analyzer, path, min_conf=bird_conf)
        rec.analyze()
        birds = pd.DataFrame(rec.detections)

    species, detections = [], []
    if not birds.empty:
        species = (birds.groupby("common_name")
                   .agg(calls=("confidence", "size"), best_conf=("confidence", "max"))
                   .sort_values("calls", ascending=False).round(2)
                   .reset_index().to_dict("records"))
        cols = [c for c in ["common_name", "scientific_name", "start_time", "end_time", "confidence"]
                if c in birds.columns]
        detections = json.loads(birds[cols].to_json(orient="records"))

    return {
        "duration": round(len(y) / SR, 1),
        "status": "ALERT" if events else "OK",
        "alerts": events,
        "activity": activity,
        "birdnet_enabled": analyzer is not None,
        "species_count": len(species),
        "shannon": round(shannon(birds), 2),
        "species": species,
        "detections": detections,
        "spectrogram": spectrogram(y),
    }
