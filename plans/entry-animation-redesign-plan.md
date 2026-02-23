# Entry Animation Redesign Plan

## Overview

Redesign the entry animation to match the HPS Labs standard spec, ensuring a seamless "curtain wipe" transition from the portfolio page to the Luna project page.

## Current Implementation Analysis

### Current HTML Structure (lines 69-77 in index.html)
```html
<div class="loader" id="loader">
    <span class="loader-tag">HPS_LABS_PRESENTS</span>
    <span class="loader-wordmark">LUNA</span>
    <div class="loader-track">
        <div class="loader-fill" id="loaderFill"></div>
    </div>
    <span class="loader-pct" id="loaderPct">0%</span>
</div>
```

### Current CSS (lines 55-115 in style.css)
- `.loader`: z-index 10000, background `var(--bg)`, fades out via opacity transition
- Progress bar with fill animation
- Simple fade-out when `.done` class is added

### Current JavaScript (lines 870-920 in luna.js)
- Waits for video metadata
- Updates progress bar percentage
- Adds `.done` class to hide loader
- Then initializes GSAP animations

---

## Target Implementation (Per Spec)

### New HTML Structure
```html
<!-- Entry Animation Curtain -->
<div id="project-entry-curtain">
  <div class="entry-content">
    <h1 class="entry-title">LUNA</h1>
  </div>
</div>
```

### New CSS Requirements
| Property | Value | Note |
|----------|-------|------|
| `position` | `fixed` | Cover viewport |
| `inset` | `0` | Full coverage |
| `z-index` | `99999` | Highest element - CRITICAL |
| `background` | `#060606` | HPS Signature Black |
| `pointer-events` | `none` | Allow clicks after animation |

### New GSAP Animation Sequence
1. Title fades in: `opacity: 1`, duration `0.8s`, ease `power2.out`
2. Title fades out: `opacity: 0`, duration `0.5s`, ease `power2.in`, delay `0.3s`
3. Curtain sweeps up: `y: -100%`, duration `0.7s`, ease `power4.inOut`

---

## Implementation Steps

### Step 1: Update HTML (index.html)
- Remove the current `.loader` structure (lines 69-77)
- Add the new `#project-entry-curtain` structure immediately after `<body>` tag
- Project name should be "LUNA"

### Step 2: Update CSS (style.css)
- Remove or comment out old `.loader` styles (lines 55-115)
- Add new `#project-entry-curtain` styles per spec
- Add `.entry-content` centering styles
- Add `.entry-title` styles with:
  - Font: `Cormorant Garamond` or fallback to existing serif
  - Size: `clamp(32px, 5vw, 64px)`
  - Weight: `300`
  - Color: `#f0ede8`
  - Letter-spacing: `0.1em`
  - Initial opacity: `0`

### Step 3: Update JavaScript (luna.js)
- Remove progress bar update logic
- Replace loader hide logic with GSAP timeline animation
- Animation should trigger after resources are loaded
- Ensure animation only plays once on initial page load

### Step 4: Integration Considerations
- The entry animation should play after video metadata is loaded
- Current video wait logic can be preserved
- GSAP timeline should replace the simple `.done` class addition
- After curtain sweeps up, initialize remaining GSAP animations

---

## Technical Constants (MUST NOT DEVIATE)

| Parameter | Value | Purpose |
|-----------|-------|---------|
| **Curtain Ease** | `power4.inOut` | Cinematic feel |
| **Curtain Duration** | `0.7s` | Match portfolio sweep speed |
| **Curtain Color** | `#060606` | HPS Signature Black |
| **Z-Index** | `99999` | Highest element |

---

## Animation Timeline Diagram

```mermaid
sequenceDiagram
    participant Page as Page Load
    participant Curtain as Entry Curtain
    participant Title as Entry Title
    participant Content as Page Content

    Page->>Curtain: Resources Loaded
    Curtain->>Title: Fade In - 0.8s power2.out
    Note over Title: Visible for 0.3s
    Title->>Title: Fade Out - 0.5s power2.in
    Curtain->>Curtain: Sweep Up - 0.7s power4.inOut
    Curtain->>Content: Reveal Page
    Content->>Content: Initialize GSAP Animations
```

---

## Files to Modify

1. **index.html** - Replace loader HTML structure
2. **style.css** - Replace loader CSS with entry curtain styles
3. **luna.js** - Implement GSAP timeline animation

## Notes

- The spec uses `Cormorant Garamond` font; if not available, can use existing project fonts
- The animation should feel like a "curtain being pulled up" to reveal the page
- This creates continuity from the portfolio page exit animation