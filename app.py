"""EcoEar: acoustic forest monitor. Run: streamlit run app.py"""
import os
import tempfile

import librosa
import numpy as np
import pandas as pd
import plotly.express as px
import plotly.graph_objects as go
import streamlit as st

SR = 16000          # YAMNet needs 16 kHz mono
MAX_SECONDS = 180   # cap clip length so demos stay fast
HOP, WIN = 0.48, 0.96  # YAMNet frame hop / window in seconds

# AudioSet class names -> alert label
ALERT_MAP = {
    "Chainsaw": "Chainsaw",
    "Gunshot, gunfire": "Gunshot",
    "Machine gun": "Gunshot",
    "Fusillade": "Gunshot",
}
# Soundscape categories (AudioSet class names)
SOUNDSCAPE = {
    "Birds": ["Bird", "Bird vocalization, bird call, bird song", "Chirp, tweet"],
    "Frogs": ["Frog", "Croak"],
    "Insects": ["Insect", "Cricket"],
    "Rain": ["Rain"],
    "Wind": ["Wind"],
}


@st.cache_resource(show_spinner="Loading YAMNet (first run downloads the model)...")
def load_yamnet():
    import tensorflow_hub as hub
    model = hub.load("https://tfhub.dev/google/yamnet/1")
    class_csv = model.class_map_path().numpy().decode("utf-8")
    names = pd.read_csv(class_csv)["display_name"].tolist()
    return model, names


@st.cache_resource(show_spinner="Loading BirdNET...")
def load_birdnet():
    try:
        from birdnetlib.analyzer import Analyzer
        return Analyzer()
    except Exception as e:  # BirdNET optional: app still works without it
        print("BirdNET unavailable:", e)
        return None


def class_idx(names, wanted):
    return [i for i, n in enumerate(names) if n in wanted]


def to_events(hit, conf, label):
    """Merge consecutive positive frames into events."""
    out, start = [], None
    for i, h in enumerate(hit):
        if h and start is None:
            start = i
        if start is not None and (not h or i == len(hit) - 1):
            end = i if not h else i + 1  # exclusive
            out.append({
                "type": label,
                "start": round(start * HOP, 2),
                "end": round((end - 1) * HOP + WIN, 2),
                "confidence": round(float(conf[start:end].max()), 3),
            })
            start = None
    return out


@st.cache_data(show_spinner=False)
def analyze(name, data, alert_thr, bird_conf):
    suffix = os.path.splitext(name)[1] or ".wav"
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        tmp.write(data)
        path = tmp.name

    y, _ = librosa.load(path, sr=SR, mono=True, duration=MAX_SECONDS)
    model, names = load_yamnet()
    scores, _, _ = model(y.astype(np.float32))
    scores = scores.numpy()

    events = []
    for label in ("Chainsaw", "Gunshot"):
        ids = class_idx(names, [k for k, v in ALERT_MAP.items() if v == label])
        if ids:
            conf = scores[:, ids].max(axis=1)
            events += to_events(conf >= alert_thr, conf, label)

    activity = {}
    for cat, wanted in SOUNDSCAPE.items():
        ids = class_idx(names, wanted)
        activity[cat] = float((scores[:, ids].max(axis=1) > 0.3).mean()) if ids else 0.0

    birds = pd.DataFrame()
    analyzer = load_birdnet()
    if analyzer is not None:
        from birdnetlib import Recording
        rec = Recording(analyzer, path, min_conf=bird_conf)
        rec.analyze()
        birds = pd.DataFrame(rec.detections)

    os.remove(path)
    return y, events, activity, birds


def shannon(birds):
    if birds.empty:
        return 0.0
    p = birds["common_name"].value_counts(normalize=True)
    return float(-(p * np.log(p)).sum())


def spectrogram_fig(y, events):
    S = librosa.power_to_db(
        librosa.feature.melspectrogram(y=y, sr=SR, n_mels=64, fmax=8000), ref=np.max)
    t = librosa.frames_to_time(np.arange(S.shape[1]), sr=SR)
    f = librosa.mel_frequencies(n_mels=64, fmax=8000)
    fig = go.Figure(go.Heatmap(z=S, x=t, y=f, colorscale="Viridis", showscale=False))
    for e in events:
        fig.add_vrect(x0=e["start"], x1=e["end"], fillcolor="red", opacity=0.35,
                      line_width=0, annotation_text=e["type"])
    fig.update_layout(height=320, xaxis_title="Time (s)", yaxis_title="Hz",
                      margin=dict(l=10, r=10, t=10, b=10))
    return fig


# ---------------- UI ----------------
st.set_page_config(page_title="EcoEar", layout="wide")
st.title("EcoEar: the forest ranger that never sleeps")
st.caption("Upload field recordings. EcoEar identifies species, scores biodiversity "
           "and raises chainsaw/gunshot alerts.")

files = st.sidebar.file_uploader("Recordings (one per recorder)",
                                 type=["wav", "mp3", "ogg", "flac"],
                                 accept_multiple_files=True)
alert_thr = st.sidebar.slider("Alert threshold", 0.2, 0.9, 0.35, 0.05)
bird_conf = st.sidebar.slider("Bird min confidence", 0.1, 0.9, 0.4, 0.05)

if not files:
    st.info("Upload one or more recordings in the sidebar to begin.")
    st.stop()

rows, details = [], []
for k, f in enumerate(files):
    with st.sidebar.expander(f"Location: {f.name}"):
        lat = st.number_input("Latitude", value=20.0 + 0.02 * k, format="%.4f", key=f"lat{k}")
        lon = st.number_input("Longitude", value=78.0 + 0.02 * k, format="%.4f", key=f"lon{k}")
    with st.spinner(f"Analyzing {f.name}..."):
        y, events, activity, birds = analyze(f.name, f.getvalue(), alert_thr, bird_conf)
    rows.append({
        "Recorder": f.name, "lat": lat, "lon": lon,
        "Species": birds["common_name"].nunique() if not birds.empty else 0,
        "Shannon": round(shannon(birds), 2),
        "Alerts": len(events),
        "Status": "ALERT" if events else "OK",
    })
    details.append((f.name, y, events, activity, birds))

summary = pd.DataFrame(rows)
c1, c2, c3 = st.columns(3)
c1.metric("Recorders", len(summary))
c2.metric("Total alerts", int(summary["Alerts"].sum()))
c3.metric("Avg Shannon index", round(summary["Shannon"].mean(), 2))

fig = px.scatter_mapbox(summary, lat="lat", lon="lon", color="Status",
                        color_discrete_map={"ALERT": "red", "OK": "green"},
                        hover_name="Recorder", hover_data=["Species", "Shannon", "Alerts"],
                        zoom=8, height=350)
fig.update_traces(marker=dict(size=16))
fig.update_layout(mapbox_style="open-street-map", margin=dict(l=0, r=0, t=0, b=0))
st.plotly_chart(fig, use_container_width=True)

tabs = st.tabs([d[0] for d in details])
for tab, (name, y, events, activity, birds) in zip(tabs, details):
    with tab:
        if events:
            for e in events:
                st.error(f"{e['type']} detected at {e['start']}s "
                         f"(confidence {e['confidence']:.0%}) on {name}")
        else:
            st.success("No illegal-activity sounds detected.")

        st.plotly_chart(spectrogram_fig(y, events), use_container_width=True)

        left, right = st.columns(2)
        with left:
            st.subheader("Soundscape activity")
            act = pd.DataFrame({"Category": list(activity), "Share of time": list(activity.values())})
            st.plotly_chart(px.bar(act, x="Category", y="Share of time", range_y=[0, 1]),
                            use_container_width=True)
        with right:
            st.subheader("Species detected")
            if load_birdnet() is None:
                st.warning("BirdNET not installed: species-level ID disabled.")
            elif birds.empty:
                st.write("No bird species above the confidence threshold.")
            else:
                tbl = (birds.groupby("common_name")
                       .agg(calls=("confidence", "size"), best_conf=("confidence", "max"))
                       .sort_values("calls", ascending=False).round(2))
                st.dataframe(tbl, use_container_width=True)

        if not birds.empty:
            st.subheader("Species timeline")
            st.plotly_chart(px.scatter(birds, x="start_time", y="common_name",
                                       size="confidence", color="confidence"),
                            use_container_width=True)
