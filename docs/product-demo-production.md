# Product motion showcases

The landing demo contains a 27 second overview and nine 12 second feature
clips: Resumes, Applications, Work, Cover letters, Portfolio, LinkedIn,
Analytics, Settings and Zebu. These are silent motion showcases with captions,
not recordings of live account operations or model responses.

All examples use the synthetic Jordan Hale workspace. Production components
are reused for resume fields and preview, final application review, work
selection, cover letter rendering, portfolio publishing controls, LinkedIn
draft review, dashboard counts and Zebu result cards. The surrounding motion
layout and simplified review/settings examples are presentation scenes. They
do not prove a real import, approval, publication, export or voice request
completed. No voice is generated or recorded.

## Playback

`ProductDemo` uses native MP4 playback with explicit play controls, no autoplay,
download links, chapter seeking, WebVTT captions and a text alternative. An
unavailable-video message offers the download and text version. Reduced-motion
users see a static poster until they deliberately start the video.

## Reproduction

Start the development server, set `FFMPEG_PATH` to a local FFmpeg executable
and, if needed, `CHROME_EXECUTABLE_PATH` and `SHOT_ORIGIN`. Run:

```text
node --import tsx scripts/render-feature-demos.mjs
```

Pass feature IDs to render only selected clips, for example:

```text
node --import tsx scripts/render-feature-demos.mjs resumes linkedin
```

The script opens `/dev/feature-demo`, starts the timed Framer Motion scene,
records at 1280 by 720, encodes H.264 MP4 with fast-start metadata, and writes
posters and caption files to `public/demo`. It blocks every API request and
fails if one is attempted. It does not sign in, submit forms, use a microphone
or call an AI provider. The capture route returns 404 in production and rejects
unknown feature IDs. FFmpeg is external tooling, not an application dependency.

The `walkthrough.mp4` and `walkthrough.vtt` paths remain overview aliases for
existing links. Earlier JPEG captures are retained but are no longer used as
a timed slideshow. The FFmpeg encoder and intermediate QA captures live outside
the repository and are not release assets.
