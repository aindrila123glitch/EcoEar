# EcoEar: Forest Acoustic Monitor

> **Autonomous Bioacoustic Threat & Biodiversity Intelligence**

EcoEar is an acoustic forest monitoring platform that listens to the forest 24/7. It identifies wildlife species, scores biodiversity using Shannon diversity metrics, and raises immediate alerts when illegal logging (chainsaws) or poaching (gunfire) signatures are detected.

---

## Key Features

- **Real-Time Acoustic Threat Detection**: Powered by Google YAMNet (trained on AudioSet) calibrated to detect chainsaws, sawing, power tools, and gunshots with sub-second timestamps.
- **Avian Species Recognition**: Integrated with BirdNET to identify local bird calls, count species occurrences, and assess detection confidence.
- **Biodiversity & Soundscape Indexing**: Computes soundscape activity distribution (Birds, Frogs, Insects, Rain, Wind) and calculates the Shannon Biodiversity Index.
- **Interactive Geospatial Sensor Network**: Leaflet-based map visualizing sensor pins (pulsing Red for `ALERT`, Green for `OK`) across coordinate points.
- **Mel-Spectrogram Heatmaps**: High-resolution Plotly frequency heatmaps with automated red-shaded hazard timebands and confidence overlays.
- **Sequential Batch Analysis**: Drag-and-drop support for field audio (`.wav`, `.mp3`, `.ogg`, `.flac`) with custom recorder locations.

---

## Architecture

- **Backend**: Python FastAPI (`api.py`), pure Python core engine (`core.py`), YAMNet (TensorFlow Hub), and BirdNET (`birdnetlib`).
- **Frontend**: React 19, Vite, Tailwind CSS, Leaflet (`react-leaflet`/vanilla Leaflet), Plotly (`plotly.js-dist-min`), and Lucide icons.
- **Fallback / Prototype**: Streamlit interactive app (`app.py`).

---

## Getting Started

### 1. Backend Setup

```bash
# Clone the repository
git clone https://github.com/aindrila123glitch/EcoEar.git
cd EcoEar

# Create and activate virtual environment (Python 3.11 or 3.12 recommended)
py -3.12 -m venv venv
.\venv\Scripts\activate   # On Windows
# source venv/bin/activate # On Linux/macOS

# Install dependencies
pip install -r requirements.txt

# Start FastAPI server
uvicorn api:app --port 8000
```
FastAPI documentation will be available at `http://localhost:8000/docs`.

### 2. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```
Open `http://localhost:5173` in your browser.

### 3. Streamlit Fallback Dashboard

```bash
streamlit run app.py
```

---

## Generating Demo Audio

You can synthesize a test field audio clip by embedding a hazard (chainsaw or gunshot) into background birdsong:

```bash
python make_demo.py birdsong.mp3 chainsaw.wav demo.wav 12
```

---

## License

MIT License.
