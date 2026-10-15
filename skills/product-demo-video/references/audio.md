# Audio

## Voice (edge-tts)

- **The tool:** edge-tts calls Microsoft Edge's free online text-to-speech. It needs no API key; run it with `uvx edge-tts`.
- **Default voice:** `en-US-AvaMultilingualNeural` (expressive, warm, clear). Good alternatives: `en-US-AndrewMultilingualNeural` (warm, confident, male), `en-US-EmmaMultilingualNeural`, `en-US-BrianMultilingualNeural`. The builder (`builder/index.html`) has a sample of each voice reading the same line. List them all with `uvx edge-tts --list-voices`. Set `"voice"` in script.json.
- **Dropped requests:** the service fails now and then. `vo.py` retries up to 8 times and caches each clip by voice and text, so re-runs only re-voice changed lines.
- **Speed:** do not speed the voice up past about +5% to fit a scene; it sounds rushed. Shorten the line, or add `extra` hold seconds to the step.
- **Writing lines:** short spoken sentences, one idea each, about 2.5 words per second. Name things the screen is showing at that moment. The visuals land on words using `ctx.at(fraction)`.
- **Better voices:** for a paid voice (ElevenLabs, OpenAI TTS), swap the edge-tts call in `vo.py`. Everything else stays the same, because timing comes from the clip lengths.

## Mix (`mix.py`)

What it builds from `timeline.json`:

- **Voice clips** placed at each step's `voStart`.
- **A pad:** a soft A minor add9 chord made from sine waves, low-passed, with gentle echo. Its volume is 0.3 before ducking, and a sidechain compressor pulls it down under the voice.
- **A whoosh** on every card or scene start (camera flight): filtered pink noise, gain 0.35.
- **A low hit** when the intro logo lands and when the outro logo forms.
- **Loudness:** `loudnorm` to -15 LUFS (social-video loudness), true peak -1.5 dB.

## Real music

Set `"music"` in script.json:

- `"pad"`: the generated pad. This is the default when the field is missing.
- a path such as `"assets/music.mp3"`: a real track. `mix.py` loops it to length, fades it in and out, and sets it to about -26 LUFS under the voice. The ducking stays the same.
- `null`: no music.

The builder's beds in `builder/audio/music/` are placeholders made in code. They are fine for a draft. Swap in a licensed track for the final cut.

`"sfx"` takes any of `"whoosh"` and `"hit"`. Use `[]` for no sound effects.

## You cannot listen

Check levels by measuring them. Compare a gap between lines with a spoken part:

```bash
ffmpeg -ss <gap_start> -t 1.2 -i out/video.mp4 -vn -af volumedetect -f null /dev/null 2>&1 | grep mean_volume
```

The voice should be about 10 dB or more above the pad-only gaps. Tell the person you have not listened to it, and ask them to check the music and whoosh levels by ear.
