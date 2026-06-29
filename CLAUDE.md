# rickys.tech

Portfolio website for Ricky S, a Computer Science undergrad specializing in GPU/HPC engineering.

## Project

Single-page static portfolio built with vanilla HTML/CSS/JS. Deployed to GitHub Pages with a custom domain (`rickys.tech`). No build tools, no frameworks — pure, modern web standards.

## Architecture

- `index.html` — Single-page HTML structure. Semantic HTML5, ARIA labels, Open Graph/Twitter Cards, JSON-LD structured data.
- `style.css` — All styling. CSS custom properties for theming, dual-font system, `prefers-reduced-motion` support, glassmorphism nav, modular component structure.
- `main.js` — All interactivity. Modular JS (Cursor, Canvas, Typewriter, ScrollReveal, Themes). Optimized `requestAnimationFrame` loops with visibility pausing. `IntersectionObserver` for scroll animations.
- `Ricky_Resume.pdf` — Downloadable CV.
- `CNAME` — GitHub Pages custom domain (`rickys.tech`).

## Design System

- **Colors:** Immersive dark (`#050510` bg) with vibrant violet `#7c3aed` accent. Subtle gradients and surface tints.
- **Typography:** `Inter` (sans-serif, headings/body) + `JetBrains Mono` (code, labels, accents). `font-display: swap`.
- **Layout:** Fluid, responsive. Maximum width `1200px`. CSS Grid for complex layouts.
- **Effects:** Generative particle network canvas background (intersection-observer paused), custom cursor (lerp-smoothed, desktop only), scroll-triggered reveal animations, card hover depth effects.
- **Theme:** Dark mode with a toggle to system/light preference (if implemented).

## Key Sections

1. Hero — Full-viewport, asymmetric layout, generative particle canvas, typewriter role cycling.
2. About — Education card, tag cloud, progressive reveal.
3. Experience — Card-based timeline with hover-expand details.
4. Projects — Dynamic grid with feature cards, hover lift effects, metrics.
5. Skills — Domain-grouped tag clouds with hover tooltips, no progress bars.
6. Contact — Prominent CTA, accessible links, optional functional form.
7. Optional: "Whatshows current interests / Now Section.

## Accessibility

- `prefers-reduced-motion` disables all animations.
- Skip-to-content link.
- ARIA labels on interactive elements.
- WCAG-compliant color contrast.
- Custom cursor disabled on touch devices.

## Performance

- No external JS libraries (pure vanilla).
- Canvas pauses when off-screen (`IntersectionObserver`).
- Self-contained, readable, and maintainable code.
- Modular JS structure.
