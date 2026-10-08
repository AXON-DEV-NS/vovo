# VOVO Hero Film — DESIGN.md

Single source of truth for the hero background film. Every scene reads from
these tokens — **no guessed colors, no invented marks, no text**.

## 1. Brand palette (read from `tailwind.config.ts` + `app/globals.css`)

| Token      | Hex       | Use in film                                  |
| ---------- | --------- | -------------------------------------------- |
| paper      | `#F5EFE1` | Video background (must match site **exactly**) |
| paperHigh  | `#FBF7ED` | Cards, chair/couch highlights, laptop shell  |
| paperLow   | `#EDE4D0` | Secondary surfaces (desk top)                |
| ink        | `#1B1915` | Character fill, primary strokes              |
| inkSoft    | `#3B372F` | Secondary fills, hair, furniture lines       |
| inkMute    | `#6F6959` | Tertiary details                             |
| inkFaint   | `#A49C88` | Disabled / faint dots                        |
| line       | `#E3DAC5` | Hairlines, dividers, inactive icon rings     |
| green50    | `#EAF0E9` | Active tint washes                           |
| green100   | `#D5E0D3` | Inactive green fills                         |
| green300   | `#82A27D` | Mid accents                                  |
| green400   | `#5D8358` | Icon strokes when "on" (secondary)           |
| green500   | `#416B41` | Active icon fill gradient start              |
| green600   | `#335433` | **Primary brand green** — checks, active dots |
| green700   | `#274127` | Gradient end / deep shade                    |
| gold300    | `#E2B354` | Warm light, sunrise rays (site uses gold)    |
| gold400    | `#D49B2E` | Clock hand, thread accent                    |
| gold500    | `#C0851F` | **Primary brand gold** — thread, moon halo   |
| gold600    | `#9C6917` | Deep gold details                            |

**Allowed accent colors are ONLY the site tokens above.** The site has no
teal/turquoise token; the logo's own dot color comes from the logo file itself
and is never re-drawn.

## 2. Typography

- Display/serif: **Fraunces** (site headings). Sans: **Inter** (site body).
- The film contains **ZERO text** (hard rule) — fonts exist only for reference
  and are not rendered.

## 3. Shapes & depth (from the site's component language)

- Corner radii: sm 0.25rem · md 0.375rem · lg 0.5rem · xl 0.75rem · 2xl 1rem.
  Icon discs/cards in the film use the 2xl/round language.
- Shadows (site tokens): `soft` `0 1px 2px rgba(27,25,21,.04), 0 8px 24px -12px rgba(27,25,21,.12)`,
  `card` `0 1px 3px rgba(27,25,21,.06), 0 12px 32px -16px rgba(27,25,21,.16)`,
  `lift` `0 2px 4px rgba(27,25,21,.05), 0 20px 48px -20px rgba(27,25,21,.22)`.
- One light direction: top-left. Soft contact shadows on the floor under every
  grounded object (character, furniture, desk).
- One stroke weight for all furniture/details (≈6px @1080p desktop art,
  ≈10px @1920-wide mobile art) — never hairline, never competing with fills.

## 4. Logo — the real file, unmodified

- **Path constant:** `LOGO_SRC = staticFile("vovo25.jpg")`
  (source: `public/vovo25.jpg`; a copy lives at `video/public/vovo25.jpg`).
- The official mark = black `V` (thick, check-like, with soft gradient tail)
  + **4 green dots** of decreasing size rising to the right. Cream background.
  It contains **no wordmark** → no cropping needed.
- In the film the logo is only ever shown as this exact raster inside a
  rounded-card container (the site shows it as a rounded app-mark). Never
  recolored, never redrawn, never replaced by an invented tile.

## 5. Hero safe zones (measured with Playwright, live DOM rects)

Measured on the cleaned hero (text-only) at 4 viewports. Video is full-bleed
`object-cover` behind the hero section.

### Desktop 1920×1080 → **action on the RIGHT half only**
- h1: x 352–928, y 407–540 (38–50%)
- sub: y 568–656 (53–61%) · actions: y 691–739 (64–68%)
- → Keep ALL art inside `x ∈ [1020, 1810]`, `y ∈ [140, 960]`.
- 1366×768 (same 16:9): h1 x 75–651 → right-half rule also safe; art x≥1020 clipped to 1728-visible-crop safe.
- 1440×900 cover-crop trims ±96px per side → art stays inside x 120–1800.

### Mobile 1080×1920 → **thin band on top + bottom third; middle empty**
- 390×844: h1 y 15–26%, sub 30–43%, actions 48–61% → video-Y 289–1172 is
  **reserved empty**.
- → Top icon band: `y ∈ [150, 300]` (visible above h1 on 390, partially under
  the 768-tablet top crop — acceptable, it fades).
- → Bottom scene: `y ∈ [1270, 1700]` primary; nothing below 1780 except soft
  shadow (390 shows to 1920 but tablet crops 1660+; keep the focal ≤1660).
- Horizontal: 390×844 shows only the central 887px of 1080 → keep all art in
  `x ∈ [120, 960]`.
- Tablets (<1024px) use the mobile source; cover-crop 768×1024 trims to the
  band y 240–1680 — the two above bands are inside it by construction.

## 6. Motion standards (from the add-on brief, enforced in code)

- No linear motion. Soft springs (`damping ≥ 20`, no bounce) + ease-in-out.
- Element transitions 0.6–1.2s; stagger siblings 80–120ms. Holds long enough
  to read. Max 2–3 things moving at once; one focal point per scene.
- ≥50% of every frame stays empty. Respect zones above.
- One stroke weight, one radius language, one palette, one light direction.
- Loop: last frame ≡ first frame (all looping motion periodic over 480 frames
  @30fps; scene elements fade to 0 at both ends).

## 7. Technical contract

- 1920×1080 & 1080×1920 · 30fps · 16.0s · 480 frames · silent (`-an`).
- MP4 H.264 + WebM VP9, faststart, colorspace tags **bt709**.
- Budgets: ≤3MB mobile, ≤6MB desktop.
- Integration: `object-cover`, CSS `mask-image` edge fades, poster = solid
  `#F5EFE1` (no image), load after `load`, respect `prefers-reduced-motion`
  and Data Saver (solid background only).
