"""Show what YAMNet hears in a clip. Usage: python diagnose.py chainsaw.wav"""
import sys

import librosa
import numpy as np

from core import SR, load_yamnet

path = sys.argv[1]
y, _ = librosa.load(path, sr=SR, mono=True)
model, names = load_yamnet()
scores = model(y.astype(np.float32))[0].numpy()
peak = scores.max(axis=0)

print("\n===== RESULT =====")
print(f"Duration: {len(y) / SR:.1f}s | peak amplitude: {float(np.abs(y).max()):.3f}")
print("Top 8 sound classes (peak score):")
for i in np.argsort(peak)[::-1][:8]:
    print(f"  {names[i]:40s} {peak[i]:.2f}")
print("Alert-related classes:")
for key in ["Chainsaw", "Sawing", "Power tool", "Gunshot, gunfire", "Machine gun"]:
    if key in names:
        print(f"  {key:40s} {peak[names.index(key)]:.2f}")
    else:
        print(f"  {key:40s} (class name not found)")