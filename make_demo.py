"""Hide a chainsaw (or gunshot) clip inside birdsong for the live demo.

Usage: python make_demo.py birdsong.mp3 chainsaw.wav demo_out.wav [insert_at_seconds]
"""
import sys

import librosa
import numpy as np
import soundfile as sf

SR = 22050
bird_path, hazard_path, out_path = sys.argv[1:4]
at = float(sys.argv[4]) if len(sys.argv) > 4 else 12.0

bird, _ = librosa.load(bird_path, sr=SR, mono=True, duration=40)
hazard, _ = librosa.load(hazard_path, sr=SR, mono=True, duration=8)

bird = bird / (np.max(np.abs(bird)) + 1e-9) * 0.5
hazard = hazard / (np.max(np.abs(hazard)) + 1e-9) * 0.8

start = int(at * SR)
if start >= len(bird):
    raise SystemExit(f"Insert time {at}s is beyond the birdsong length ({len(bird) / SR:.1f}s)")
end = min(len(bird), start + len(hazard))
bird[start:end] += hazard[: end - start]

sf.write(out_path, bird / (np.max(np.abs(bird)) + 1e-9) * 0.9, SR)
print(f"Wrote {out_path}: hazard inserted at {at}s")
