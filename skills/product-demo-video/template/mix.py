"""Build the soundtrack from timeline.json: voice lines, a soft synth pad that ducks under the voice,
and a whoosh on every camera flight. Then mux it onto the silent render.
  python3 mix.py [out/video-silent.mp4] [out/video.mp4]
"""
import json, subprocess, sys
from pathlib import Path

silent = sys.argv[1] if len(sys.argv) > 1 else "out/video-silent.mp4"
final = sys.argv[2] if len(sys.argv) > 2 else "out/video.mp4"
tl = json.loads(Path("timeline.json").read_text())
T = tl["total"]
MUSIC = tl.get("music", "pad")        # "pad" (generated), a path to an audio file, or null for none
SFX = tl.get("sfx", ["whoosh", "hit"])  # any of: whoosh, hit
run = lambda *a: subprocess.run(["ffmpeg", "-y", "-loglevel", "error", *a], check=True)
Path("out/sfx").mkdir(parents=True, exist_ok=True)

# soft pad: A minor add9 chord from sine waves, gentle tremolo, low-passed, fades in and out
notes = [110.0, 164.81, 220.0, 261.63, 329.63, 493.88]
expr = "+".join(f"{0.16 if f < 200 else 0.09}*sin(2*PI*{f}*t)*(0.75+0.25*sin(2*PI*{0.07 + i * 0.031:.3f}*t))" for i, f in enumerate(notes))
if MUSIC == "pad":
    run("-f", "lavfi", "-i", f"aevalsrc='{expr}':s=48000:d={T}", "-af",
        f"lowpass=f=1800,aecho=0.8:0.7:180|340:0.25|0.18,afade=t=in:d=3,afade=t=out:st={T - 3}:d=3,volume=0.3", "out/sfx/pad.wav")
elif MUSIC:  # a real track: loop it to length, fade in and out, sit it well under the voice
    run("-stream_loop", "-1", "-i", MUSIC, "-t", str(T), "-af",
        f"aresample=48000,loudnorm=I=-26:TP=-3,afade=t=in:d=2,afade=t=out:st={T - 3}:d=3", "out/sfx/pad.wav")
else:  # no music: silence keeps the rest of the mix graph unchanged
    run("-f", "lavfi", "-i", f"anullsrc=r=48000:cl=stereo", "-t", str(T), "out/sfx/pad.wav")
# whoosh: pink noise swept through a band-pass, short fade in/out
run("-f", "lavfi", "-i", "anoisesrc=c=pink:d=1.4:a=0.8", "-af",
    "highpass=f=300,lowpass=f=5000,afade=t=in:d=0.55:curve=exp,afade=t=out:st=0.6:d=0.8,volume=0.9", "out/sfx/whoosh.wav")
# low hit for logo moments
run("-f", "lavfi", "-i", "aevalsrc='0.9*sin(2*PI*(55+40*exp(-6*t))*t)*exp(-3*t)':s=48000:d=1.6", "-af", "volume=0.9", "out/sfx/hit.wav")

events = []  # (file, start seconds, gain)
for s in tl["steps"]:
    if s.get("line"):
        events.append((f"out/vo/{s['id']}.mp3", s["voStart"], 1.0))
    if s["kind"] in ("node", "scene") and "whoosh" in SFX:
        events.append(("out/sfx/whoosh.wav", s["start"] + 0.05, 0.35))
by = {s["kind"]: s for s in tl["steps"] if s["kind"] in ("intro", "overview", "outro")}
if "intro" in by and "hit" in SFX: events.append(("out/sfx/hit.wav", by["intro"]["start"] + by["intro"]["dur"] - 1.1, 0.6))  # logo lands
if "overview" in by and "whoosh" in SFX: events.append(("out/sfx/whoosh.wav", by["overview"]["start"] + 0.3, 0.4))
if "outro" in by and "hit" in SFX: events.append(("out/sfx/hit.wav", by["outro"]["start"] + 1.8, 0.6))

inputs = ["-i", "out/sfx/pad.wav"] + sum((["-i", f] for f, _, _ in events), [])
f = []
for k, (_, st, g) in enumerate(events):
    ms = int(st * 1000)
    f.append(f"[{k + 1}:a]aresample=48000,aformat=channel_layouts=stereo,volume={g},adelay={ms}|{ms}[e{k}]")
vo_ids = [k for k, (fn, _, _) in enumerate(events) if fn.startswith("out/vo/")]
fx_ids = [k for k in range(len(events)) if k not in vo_ids]
f.append("".join(f"[e{k}]" for k in vo_ids) + f"amix=inputs={len(vo_ids)}:normalize=0,apad[vo]")
f.append("[vo]asplit[vo1][vo2]")
f.append("[0:a]aformat=channel_layouts=stereo[pad]")
f.append("[pad][vo2]sidechaincompress=threshold=0.03:ratio=6:attack=40:release=500[duck]")
f.append(f"[vo1][duck]" + "".join(f"[e{k}]" for k in fx_ids) + f"amix=inputs={2 + len(fx_ids)}:normalize=0,atrim=0:{T},loudnorm=I=-15:TP=-1.5:LRA=9[out]")
run(*inputs, "-filter_complex", ";".join(f), "-map", "[out]", "-c:a", "pcm_s16le", "out/sfx/mix.wav")
run("-i", silent, "-i", "out/sfx/mix.wav", "-map", "0:v", "-map", "1:a", "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", "-t", str(T), final)
print("wrote", final)
