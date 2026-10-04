"""EcoEar API. Run: uvicorn api:app --host 0.0.0.0 --port 8000"""
import os
import tempfile

from fastapi import FastAPI, File, Form, UploadFile
from fastapi.middleware.cors import CORSMiddleware

from core import analyze_file, load_birdnet, load_yamnet

app = FastAPI(title="EcoEar API")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])


@app.on_event("startup")
def warm_up():
    load_yamnet()   # download/load models once so the first request is fast
    load_birdnet()


@app.get("/health")
def health():
    return {"ok": True}


@app.post("/analyze")
def analyze(file: UploadFile = File(...), alert_thr: float = Form(0.35), bird_conf: float = Form(0.4)):
    suffix = os.path.splitext(file.filename or "")[1] or ".wav"
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        tmp.write(file.file.read())
        path = tmp.name
    try:
        result = analyze_file(path, alert_thr, bird_conf)
    finally:
        os.remove(path)
    result["filename"] = file.filename
    return result
