# Travel YouTube Map — Claude Code Instructions

## Design System
Always read DESIGN.md before making any visual or UI decisions.
All font choices, colors, spacing, and aesthetic direction are defined there.
Do not deviate without explicit user approval.
In QA mode, flag any code that doesn't match DESIGN.md.

## Key Design Tokens
- Fonts: Inter (body), JetBrains Mono (timestamps only)
- Accent: #ef4444 (red) — single accent color
- Dark backgrounds: #0a0a0a (base) → #111111 (panel) → #1a1a1a (surface)
- Active timeline row: border-left 3px #ef4444 + rgba(239,68,68,0.12) background
- Map polyline: #ef4444, 0.7 opacity, dashed

## Tech Stack
- Next.js 14 App Router + TypeScript + Tailwind CSS
- Google Maps JavaScript API
- Claude API (claude-sonnet-4-6) for place extraction
- Google Geocoding API
- OpenAI Whisper API (fallback STT)
- yt-dlp + ffmpeg for audio/keyframe extraction

## Testing
- Jest + React Testing Library
- Run: `npx jest`
- Test files: `__tests__/` directory
