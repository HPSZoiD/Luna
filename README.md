# 🌙 Luna — Your Loving AI Companion

**Luna** is a premium, cinematic landing page experience for an emotional AI presence. Built with an "Awwwards-grade" mindset, it combines high-performance frame-scrubbing transitions, buttery-smooth scrolling, and a minimal, high-contrast aesthetic.

![Luna Hero](og.png)

## ✨ Features

- **Cinematic Transitions:** Two independent, high-fidelity scroll-scrubbed video sequences powered by a custom Canvas interaction engine.
- **Buttery Smooth Scroll:** Integrated with **Lenis** for native-feeling inertia and **GSAP** for precision-timed reveals.
- **Performance First:** 
  - Optimized frame count (60 frames/sequence) with high-quality interpolation.
  - Smart preloading with batch processing and UI feedback.
  - Page Visibility API & Intersection Observers to pause logic when off-screen.
  - GPU-accelerated CSS transforms and throttled scroll handlers.
- **Adaptive UI:** A minimalist diagnostic panel showing Luna's emotional adaptation modes (Affection, Initiation, Memory Depth, etc.).
- **Responsive Aesthetics:** Dark mode by default, featuring custom grain textures, ambient blooms, and an interactive "Moon Ring" signature visual.

## 🛠️ Tech Stack

- **Animations:** [GSAP](https://gsap.com/) & [ScrollTrigger](https://gsap.com/scrolltrigger/)
- **Smooth Scrolling:** [Lenis](https://lenis.darkroom.engineering/)
- **Typography:** [SplitType](https://github.com/lukePeavey/SplitType)
- **Canvas:** Custom `VideoScrubber` class for frame-by-frame scrubbing.
- **Styles:** Vanilla CSS with custom property tokens and GPU-accelerated layers.

## 🚀 Performance Optimizations

Luna is built to run smoothly even on mid-range devices:
- **Frame Reduction:** We reduced preloaded frames by 68% (from 192 to 60) while maintaining visual fluidity through Easing Interpolation.
- **Resource Throttling:** Scroll events are throttled to ~60fps via `performance.now()` checks.
- **Memory Management:** Canvas elements only draw when visible, and the `tick()` loop pauses when the tab is hidden.

## 📂 Project Structure

- `index.html` — The main structure and SVG filters.
- `luna.js` — The "Luna Engine" (Lenis, GSAP, and VideoScrubber).
- `style.css` — Cinematic tokens and design system.
- `assets/` — Optimized WebP visuals and UI elements.
- `luna-frames/` & `luna-frames2/` — High-fidelity sequence frames.

## ⚖️ License

Project by **HPS Labs**. All rights reserved. © 2026.
