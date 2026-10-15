"""Synthesise placeholder music beds and sound effects (no samples, no licences needed).

    uv run --with numpy python make_music.py

Each bed is 24 s, loops cleanly, and is peak-normalised so it sits under a voice. They are
honest placeholders: good enough to choose a mood, meant to be swapped for a licensed track.
"""
import subprocess
import numpy as np
from pathlib import Path

SR = 44100
OUT = Path(__file__).parent
(OUT / "music").mkdir(exist_ok=True)
(OUT / "sfx").mkdir(exist_ok=True)
rng = np.random.default_rng(7)


def t_axis(sec):
    return np.arange(int(sec * SR)) / SR


def note(f, dur, kind="sine", a=0.01, d=0.2, s=0.6, r=0.3, vel=1.0):
    t = t_axis(dur + r)
    if kind == "sine":
        w = np.sin(2 * np.pi * f * t)
    elif kind == "soft":  # warm: sine + a little 2nd/3rd harmonic
        w = np.sin(2 * np.pi * f * t) + 0.3 * np.sin(4 * np.pi * f * t) + 0.12 * np.sin(6 * np.pi * f * t)
    elif kind == "pluck":  # piano-ish: harmonics that decay faster than the fundamental
        w = sum((0.6 ** k) * np.sin(2 * np.pi * f * (k + 1) * t) * np.exp(-t * (2 + 3 * k)) for k in range(5))
    elif kind == "saw":
        w = sum(((-1) ** (k + 1)) * np.sin(2 * np.pi * f * k * t) / k for k in range(1, 12))
    else:
        raise ValueError(kind)
    env = np.ones_like(t)
    na, nd, nr = int(a * SR), int(d * SR), int(r * SR)
    env[:na] = np.linspace(0, 1, na)
    env[na:na + nd] = np.linspace(1, s, nd)
    env[na + nd:] = s
    env[-nr:] *= np.linspace(1, 0, nr)
    return w * env * vel


def lowpass(x, cutoff):
    a = np.exp(-2 * np.pi * cutoff / SR)
    y = np.empty_like(x)
    acc = 0.0
    for i, v in enumerate(x):  # one-pole filter; fine for 24 s of audio
        acc = (1 - a) * v + a * acc
        y[i] = acc
    return y


def reverb(x, mix=0.25):
    out = x.copy()
    for delay, g in [(0.029, .5), (0.037, .45), (0.041, .42), (0.053, .38), (0.071, .3), (0.113, .25)]:
        n = int(delay * SR)
        buf = np.zeros_like(x)
        buf[n:] = x[:-n] * g
        for _ in range(3):  # a few feedback passes
            buf[n:] += buf[:-n] * g * .5
        out += buf * mix
    return out


def place(track, clip, at):
    i = int(at * SR)
    j = min(len(track), i + len(clip))
    track[i:j] += clip[: j - i]


def kick():
    t = t_axis(0.35)
    return np.sin(2 * np.pi * (45 + 90 * np.exp(-t * 25)) * t) * np.exp(-t * 9)


def snare():
    t = t_axis(0.25)
    return (rng.standard_normal(len(t)) * 0.7 + np.sin(2 * np.pi * 190 * t) * 0.4) * np.exp(-t * 18)


def hat(open_=False):
    t = t_axis(0.12 if not open_ else 0.3)
    n = rng.standard_normal(len(t))
    n = n - lowpass(n, 6000)  # crude high-pass
    return n * np.exp(-t * (40 if not open_ else 12)) * 0.5


def finish(x, name, folder="music", fade=1.5, peak=0.7):
    x = x / (np.max(np.abs(x)) + 1e-9) * peak
    nf = int(fade * SR)
    x[:nf] *= np.linspace(0, 1, nf)
    x[-nf:] *= np.linspace(1, 0, nf)
    stereo = np.stack([x, np.roll(x, 90)], axis=1)  # tiny width
    raw = (stereo * 32767).astype(np.int16).tobytes()
    path = OUT / folder / f"{name}.mp3"
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-f", "s16le", "-ar", str(SR), "-ac", "2", "-i", "-",
                    "-b:a", "160k", str(path)], input=raw, check=True)
    print("wrote", path)


D = 24.0
hz = lambda m: 440 * 2 ** ((m - 69) / 12)  # midi -> Hz
PROG = [[57, 60, 64, 71], [53, 57, 60, 67], [48, 52, 55, 62], [55, 59, 62, 69]]  # Am9  Fmaj9  Cadd9  G6/9

# 1. Ambient pad: slow evolving chords, lots of space
x = np.zeros(int(D * SR))
for i, ch in enumerate(PROG * 2):
    for m in ch:
        place(x, note(hz(m - 12), 3.0, "soft", a=1.2, d=1, s=.8, r=1.8, vel=.25), i * 3.0)
finish(reverb(lowpass(x, 1800), .4), "ambient-pad")

# 2. Soft piano: gentle arpeggios over a quiet pad, 80 bpm
x = np.zeros(int(D * SR)); beat = 60 / 80
for bar in range(8):
    ch = PROG[bar % 4]
    for k, m in enumerate([ch[0], ch[1], ch[2], ch[3], ch[2], ch[1], ch[2], ch[3]]):
        place(x, note(hz(m), .5, "pluck", a=.003, d=.3, s=.3, r=.8, vel=.55), bar * 4 * beat + k * beat / 2)
    for m in ch[:3]:
        place(x, note(hz(m - 12), 4 * beat, "soft", a=.6, s=.7, r=1, vel=.12), bar * 4 * beat)
finish(reverb(x, .35), "soft-piano")

# 3. Upbeat tech: 118 bpm four-on-the-floor, offbeat hats, bass arp, bright pad
x = np.zeros(int(D * SR)); beat = 60 / 118
for b in range(int(D / beat)):
    place(x, kick() * .9, b * beat)
    place(x, hat() * .5, b * beat + beat / 2)
    if b % 2 == 1:
        place(x, snare() * .35, b * beat)
    ch = PROG[(b // 8) % 4]
    for k in range(2):
        place(x, lowpass(note(hz(ch[0] - 24 + (12 if k else 0)), beat / 2.2, "saw", a=.005, d=.1, s=.5, r=.05, vel=.25), 900), b * beat + k * beat / 2)
for i in range(int(D / (8 * beat)) + 1):
    for m in PROG[i % 4]:
        place(x, lowpass(note(hz(m), 8 * beat, "saw", a=.4, s=.6, r=.5, vel=.06), 2500), i * 8 * beat)
finish(reverb(x, .15), "upbeat-tech", peak=.75)

# 4. Cinematic swell: low drone, rising noise, slow hits
x = np.zeros(int(D * SR)); t = t_axis(D)
x += np.sin(2 * np.pi * hz(33) * t) * .3 + np.sin(2 * np.pi * hz(40) * t) * .18
swell = lowpass(rng.standard_normal(len(t)), 700) * np.clip(np.sin(np.pi * (t % 12) / 12), 0, 1) ** 2 * .6
x += swell
for at in [0, 6, 12, 18]:
    place(x, kick() * 1.2, at)
    for m in PROG[(int(at) // 6) % 4]:
        place(x, note(hz(m), 5.5, "soft", a=2, s=.8, r=2, vel=.12), at)
finish(reverb(lowpass(x, 2500), .5), "cinematic-swell")

# 5. Lo-fi groove: 84 bpm laid-back beat, warm chords, vinyl crackle
x = np.zeros(int(D * SR)); beat = 60 / 84
for b in range(int(D / beat)):
    swing = beat * .08 if b % 2 else 0
    if b % 4 in (0, 2) or (b % 8 == 7):
        place(x, kick() * .8, b * beat + swing)
    if b % 4 in (1, 3):
        place(x, lowpass(snare(), 3000) * .45, b * beat)
    place(x, hat() * .25, b * beat + beat / 2 + beat * .06)
for bar in range(int(D / (4 * beat)) + 1):
    for m in PROG[bar % 4]:
        place(x, lowpass(note(hz(m), 3.6 * beat, "pluck", a=.01, s=.4, r=.6, vel=.3), 1600), bar * 4 * beat)
crackle = (rng.random(len(x)) > .9993) * rng.standard_normal(len(x)) * .25
x += lowpass(crackle, 4000) + lowpass(rng.standard_normal(len(x)), 300) * .01
finish(reverb(x, .2), "lofi-groove")

# 6. Minimal pulse: muted ticks and a sub line, very understated, 100 bpm
x = np.zeros(int(D * SR)); beat = 60 / 100
for b in range(int(D / (beat / 2))):
    place(x, lowpass(note(hz(81), .05, "sine", a=.001, d=.04, s=0, r=.02, vel=.25), 3000), b * beat / 2)
for bar in range(int(D / (4 * beat)) + 1):
    place(x, note(hz(PROG[bar % 4][0] - 24), 4 * beat, "sine", a=.05, s=.8, r=.3, vel=.5), bar * 4 * beat)
finish(reverb(x, .3), "minimal-pulse")

# ---- sound effects ----
def sfx(x, name):
    finish(x, name, folder="sfx", fade=.02, peak=.8)

t = t_axis(1.2)
n = rng.standard_normal(len(t))
sweep = np.concatenate([lowpass(n[i:i + 2205], 300 + 5000 * (i / len(t))) for i in range(0, len(t), 2205)])[: len(t)]
sfx(sweep * np.sin(np.pi * t / 1.2) ** 2, "whoosh")
t = t_axis(.08); sfx(np.sin(2 * np.pi * 1800 * t) * np.exp(-t * 90) + rng.standard_normal(len(t)) * np.exp(-t * 200) * .3, "click")
t = t_axis(.25); sfx(np.sin(2 * np.pi * (400 + 900 * t) * t) * np.exp(-t * 18), "pop")
t = t_axis(.4); sfx(note(hz(84), .12, "sine", a=.002, d=.1, s=.2, r=.25, vel=1) + note(hz(91), .12, "sine", a=.002, d=.1, s=.2, r=.25, vel=.6)[:len(note(hz(84), .12, "sine", a=.002, d=.1, s=.2, r=.25))], "chime")
t = t_axis(2.0); sfx(lowpass(rng.standard_normal(len(t)), 2000) * (t / 2) ** 2 + np.sin(2 * np.pi * (200 + 400 * t) * t) * (t / 2) ** 3 * .5, "riser")
