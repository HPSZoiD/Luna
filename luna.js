/* ==============================================================
   LUNA — Premium Interaction Engine
   GSAP · Lenis · SplitType · Canvas · Particles
   ============================================================== */
(function () {
    'use strict';

    /* ──────────── CONFIG ──────────── */
    const FRAME_DIR = 'luna-frames/';
    const FRAME_PREFIX = 'ezgif-frame-';
    const FRAME_EXT = '.jpg';
    const TOTAL_FRAMES = 60; // Optimized from 192 - every 3rd frame for smooth playback
    const PLAY_END = 0.75;
    const EASE_FACTOR = 0.12;
    const PARTICLE_COUNT = 28;

    /* ============================================================
       0. PAGE VISIBILITY & PERFORMANCE TRACKING
    ============================================================ */
    function initPerformanceObservers() {
        // Track page visibility to pause animations when hidden
        document.addEventListener('visibilitychange', () => {
            isPageVisible = !document.hidden;
        });

        // Autoplay Unlock: Many browsers block muted autoplay until first interaction
        const unlockVideos = () => {
            const v2 = document.getElementById('lunaVideo2');
            if (v2 && v2.paused) v2.play().catch(() => { });
            window.removeEventListener('scroll', unlockVideos);
            window.removeEventListener('click', unlockVideos);
            window.removeEventListener('touchstart', unlockVideos);
        };
        window.addEventListener('scroll', unlockVideos, { once: true });
        window.addEventListener('click', unlockVideos, { once: true });
        window.addEventListener('touchstart', unlockVideos, { once: true });

        // Intersection Observer for canvas visibility
        if ('IntersectionObserver' in window) {
            const canvasObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    const id = entry.target.id;
                    // Only update if it's currently in the viewport
                    if (id === 'lunaVideo' && window.introController) {
                        window.introController.isVisible = entry.isIntersecting;
                    }
                    if (id === 'lunaVideo2') {
                        const v = entry.target;
                        if (entry.isIntersecting) {
                            // Try playing, catch if blocked
                            v.play().catch(() => {
                                // If blocked, we'll try again on next interaction
                                console.log('[Video] lunaVideo2 play blocked, waiting for interaction');
                            });
                        } else {
                            v.pause();
                        }
                    }
                });
            }, { threshold: 0.1 });

            const v1 = document.getElementById('lunaVideo');
            const v2 = document.getElementById('lunaVideo2');
            if (v1) canvasObserver.observe(v1);
            if (v2) canvasObserver.observe(v2);
        }
    }
    let frames = [], frameCount = 0, isReady = false;
    let targetIdx = 0, currentIdx = 0, rafId = null;
    let mx = innerWidth / 2, my = innerHeight / 2;
    let glowX = mx, glowY = my;
    let particles = [];

    /* ──────────── PERFORMANCE STATE ──────────── */
    let isPageVisible = true;
    let scrollRAF = null;
    let lastScrollTime = 0;
    const SCROLL_THROTTLE = 16; // ~60fps

    /* ──────────── DOM ──────────── */
    const $ = s => document.querySelector(s);
    const $$ = s => document.querySelectorAll(s);

    const canvas = $('#lunaCanvas');
    const ctx = canvas ? canvas.getContext('2d') : null;
    const entryCurtain = $('#project-entry-curtain');
    const lunaGlow = $('#lunaGlow');
    const scrollTrack = $('#scrollTrack');
    const heroTitle = $('.hero-title');
    const heroContent = $('.hero-content');
    const dot = $('#curDot');
    const glow = $('#curGlow');
    const scrollProg = $('#scrollProg');
    const pCanvas = $('#particleCanvas');
    const pCtx = pCanvas ? pCanvas.getContext('2d') : null;

    /* ============================================================
       1. LENIS SMOOTH SCROLL
    ============================================================ */
    let lenis;
    let scrollVelocity = 0;
    function initLenis() {
        if (typeof Lenis === 'undefined') return;
        lenis = new Lenis({
            duration: 1.2,
            easing: t => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
            orientation: 'vertical',
            smoothWheel: true
        });
        lenis.on('scroll', (e) => {
            if (typeof ScrollTrigger !== 'undefined') ScrollTrigger.update();
            scrollVelocity = e.velocity || 0;
        });
        gsap.ticker.add(time => lenis.raf(time * 1000));
        gsap.ticker.lagSmoothing(0);
    }

    /* ============================================================
       2. NOISE / GRAIN GENERATOR
    ============================================================ */
    function initGrain() {
        const grainEl = $('.grain');
        if (!grainEl) return;
        const size = 256;
        const c = document.createElement('canvas');
        c.width = size; c.height = size;
        const g = c.getContext('2d');
        const img = g.createImageData(size, size);
        for (let i = 0; i < img.data.length; i += 4) {
            const v = Math.random() * 255;
            img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
            img.data[i + 3] = 255;
        }
        g.putImageData(img, 0, 0);
        grainEl.style.backgroundImage = `url(${c.toDataURL('image/png')})`;
        grainEl.style.backgroundSize = `${size}px ${size}px`;
    }

    /* ============================================================
       3. PARTICLE SYSTEM
    ============================================================ */
    function initParticles() {
        if (!pCanvas || !pCtx) return;
        resizeParticleCanvas();
        window.addEventListener('resize', resizeParticleCanvas);
        for (let i = 0; i < PARTICLE_COUNT; i++) {
            particles.push({
                x: Math.random() * pCanvas.width,
                y: Math.random() * pCanvas.height,
                r: Math.random() * 1.8 + 0.4,
                vx: (Math.random() - 0.5) * 0.3,
                vy: -Math.random() * 0.4 - 0.1,
                alpha: Math.random() * 0.25 + 0.05
            });
        }
    }
    function resizeParticleCanvas() {
        if (!pCanvas) return;
        pCanvas.width = innerWidth;
        pCanvas.height = innerHeight;
    }
    function drawParticles() {
        if (!pCtx) return;
        pCtx.clearRect(0, 0, pCanvas.width, pCanvas.height);
        for (const p of particles) {
            p.x += p.vx;
            p.y += p.vy;
            if (p.y < -10) { p.y = pCanvas.height + 10; p.x = Math.random() * pCanvas.width; }
            if (p.x < -10) p.x = pCanvas.width + 10;
            if (p.x > pCanvas.width + 10) p.x = -10;
            pCtx.beginPath();
            pCtx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
            pCtx.fillStyle = `rgba(155, 140, 255, ${p.alpha})`;
            pCtx.fill();
        }
    }

    /* ============================================================
       VideoController Class - Handles scroll-synced video scrubbing
    ============================================================ */
    class VideoController {
        constructor(videoId, trackId) {
            this.video = document.getElementById(videoId);
            this.track = document.getElementById(trackId);
            this.isReady = false;
            this.isVisible = true;
            this.targetTime = 0;
            this.currentTime = 0;

            // Debug: Expose controller to window for inspection
            if (videoId === 'lunaVideo') window.introController = this;
            if (videoId === 'lunaVideo2') window.bridgeController = this;

            if (this.video) {
                // Initialize video settings for scrubbing
                this.video.muted = true;
                this.video.playsInline = true;
                this.video.preload = 'auto';

                const onMetadata = () => {
                    this.isReady = true;
                    // Force a play/pause cycle to unlock the engine
                    const p = this.video.play();
                    if (p !== undefined) {
                        p.then(() => {
                            this.video.pause();
                        }).catch(() => { });
                    }
                };

                this.video.addEventListener('loadedmetadata', onMetadata);
                if (this.video.readyState >= 1) onMetadata();
            }
        }

        onScroll(st) {
            if (!this.track || !this.video || !this.video.duration) {
                return 0;
            }
            const rect = this.track.getBoundingClientRect();
            const trackTop = rect.top + window.scrollY;
            const trackHeight = this.track.scrollHeight;

            let p = (window.scrollY - trackTop) / (trackHeight - window.innerHeight);
            p = Math.max(0, Math.min(1, p));

            // Map progress to video duration
            this.targetTime = p * this.video.duration;
            return p;
        }

        update() {
            if (!this.isReady || !this.video || !this.isVisible) return;

            // Performance: only update if time has meaningfully changed
            const diff = this.targetTime - this.currentTime;
            if (Math.abs(diff) > 0.001) {
                this.currentTime += diff * 0.25;
                this.video.currentTime = this.currentTime;
            }
        }
    }

    let introController, bridgeController;

    /* ============================================================
       4. CANVAS SETUP (DEPRECATED: Using video elements now)
    ============================================================ */

    /* ============================================================
       VideoScrubber (Legacy Canvas) - Kept for compatibility if needed
    ============================================================ */
    class VideoScrubber {
        constructor(canvasId, trackId, dir, frameCount = 60) {
            this.canvas = document.getElementById(canvasId);
            if (!this.canvas) return;
            this.ctx = this.canvas.getContext('2d', { alpha: true });
            this.track = document.getElementById(trackId);
            this.dir = dir;
            this.totalFrames = frameCount;
            this.frames = [];
            this.isReady = false;
            this.isVisible = true;
            this.targetIdx = 0;
            this.currentIdx = 0;
            this.PLAY_END = 0.75;
            this.lastDrawnFrame = -1;
            window.addEventListener('resize', () => this.resize());
            this.resize();
        }
        resize() {
            this.canvas.width = window.innerWidth;
            this.canvas.height = window.innerHeight;
            if (this.isReady) this.drawFrame(Math.round(this.currentIdx));
        }
        async preload(onProgress) {
            const BATCH = 8;
            let loaded = 0;
            for (let s = 0; s < this.totalFrames; s += BATCH) {
                const end = Math.min(s + BATCH, this.totalFrames);
                const batch = [];
                for (let i = s; i < end; i++) {
                    batch.push(this.loadOne(i).then(r => { this.frames.push(r); loaded++; if (onProgress) onProgress(loaded, this.totalFrames); }));
                }
                await Promise.all(batch);
                await new Promise(r => setTimeout(r, 0));
            }
            this.frames.sort((a, b) => a.index - b.index);
            this.isReady = true;
        }
        loadOne(i) {
            return new Promise((resolve, reject) => {
                const img = new Image();
                img.onload = () => resolve({ index: i, image: img });
                img.onerror = () => reject(i);
                img.src = `${this.dir}ezgif-frame-${String(i + 1).padStart(3, '0')}.jpg`;
            });
        }
        drawFrame(idx) {
            if (idx === this.lastDrawnFrame || idx < 0 || idx >= this.frames.length) return;
            this.lastDrawnFrame = idx;
            const f = this.frames[idx];
            if (!f || !f.image) return;
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            const ir = f.image.width / f.image.height;
            const cr = this.canvas.width / this.canvas.height;
            let dw, dh;
            if (ir > cr) { dh = this.canvas.height; dw = dh * ir; }
            else { dw = this.canvas.width; dh = dw / ir; }
            const ox = (this.canvas.width - dw) / 2;
            const oy = (this.canvas.height - dh) / 2;
            this.ctx.drawImage(f.image, ox, oy, dw, dh);
        }
        update() {
            if (!this.isVisible || !this.isReady) return;
            const diff = this.targetIdx - this.currentIdx;
            this.currentIdx = Math.abs(diff) < 0.01 ? this.targetIdx : this.currentIdx + diff * EASE_FACTOR;
            this.drawFrame(Math.round(this.currentIdx));
        }
        onScroll(st) {
            if (!this.track) return;
            const rect = this.track.getBoundingClientRect();
            const trackTop = rect.top + window.scrollY;
            const trackHeight = this.track.scrollHeight;
            let p = (window.scrollY - trackTop) / (trackHeight - window.innerHeight);
            p = Math.max(0, Math.min(1, p));
            this.targetIdx = p >= this.PLAY_END ? this.frames.length - 1 : Math.min(Math.floor((p / this.PLAY_END) * this.frames.length), this.frames.length - 1);
            return p;
        }
    }

    let introScrubber, bridgeScrubber;

    /* ============================================================
       8. SCROLL → FRAME + PARALLAX (Optimized with throttling)
    ============================================================ */
    function handleScroll() {
        // Throttle scroll handler to ~60fps
        const now = performance.now();
        if (now - lastScrollTime < SCROLL_THROTTLE) return;
        lastScrollTime = now;

        const st = window.scrollY;

        // Intro controller
        if (introController) {
            const p = introController.onScroll(st);

            /* Intro specific visuals */
            if (lunaGlow) lunaGlow.style.opacity = (0.1 + p * 0.25).toFixed(3);
            const moonRing = document.querySelector('.moon-ring');
            if (moonRing) {
                const ringScale = 1 + p * 0.15;
                const ringOp = Math.max(0.3 - p * 0.6, 0);
                moonRing.style.transform = `translate(-50%, -50%) rotate(${p * 120}deg) scale(${ringScale})`;
                moonRing.style.opacity = ringOp;
            }
            if (heroContent) {
                const drift = p * -60;
                const fade = Math.max(1 - p * 2.5, 0);
                heroContent.style.transform = `translateY(${drift}px)`;
                heroContent.style.opacity = fade;
            }
        }

        // Bridge controller
        if (bridgeController) {
            const p = bridgeController.onScroll(st);
            /* Maybe add bridge specific effects here later */
        }

        /* Scroll progress bar */
        const totalMax = document.documentElement.scrollHeight - innerHeight;
        const totalP = Math.min(st / totalMax, 1);
        if (scrollProg) scrollProg.style.height = (totalP * 100) + '%';

        /* ── SCROLL VELOCITY SKEW ── */
        const clampedV = Math.max(-3, Math.min(3, scrollVelocity * 0.015));
        document.body.style.setProperty('--skew', clampedV + 'deg');
        $$('.section, .gallery, .manifesto, .cta, .marquee, .bridge-track').forEach(el => {
            el.style.transform = `skewY(${clampedV}deg)`;
        });

        /* ── PARALLAX DEPTH LAYERS ── */
        const pxShapes = $$('.px-shape');
        const speeds = [0.03, 0.05, 0.04, 0.06, 0.02];
        pxShapes.forEach((shape, i) => {
            const spd = speeds[i % speeds.length];
            shape.style.transform = `translateY(${-st * spd}px)`;
        });

        /* ── SECTION COLOR TRANSITIONS ── */
        const colorStops = [
            { at: 0.0, bg: [10, 10, 14] },
            { at: 0.2, bg: [12, 11, 18] },
            { at: 0.5, bg: [10, 10, 16] },
            { at: 0.7, bg: [11, 10, 14] },
            { at: 1.0, bg: [10, 10, 14] }
        ];
        let c0 = colorStops[0], c1 = colorStops[1];
        for (let i = 0; i < colorStops.length - 1; i++) {
            if (totalP >= colorStops[i].at && totalP <= colorStops[i + 1].at) {
                c0 = colorStops[i]; c1 = colorStops[i + 1]; break;
            }
        }
        const localP = (totalP - c0.at) / (c1.at - c0.at || 1);
        const r = Math.round(c0.bg[0] + (c1.bg[0] - c0.bg[0]) * localP);
        const g = Math.round(c0.bg[1] + (c1.bg[1] - c0.bg[1]) * localP);
        const b = Math.round(c0.bg[2] + (c1.bg[2] - c0.bg[2]) * localP);
        document.body.style.backgroundColor = `rgb(${r},${g},${b})`;

        /* ── CHAPTER INDICATOR ── */
        const chapters = $$('.chapter-dot');
        const sectionMap = [
            { el: document.querySelector('.hero-sticky'), dot: chapters[0] },
            { el: document.querySelector('.manifesto'), dot: chapters[1] },
            { el: document.querySelector('.card-grid'), dot: chapters[2] },
            { el: document.querySelector('.gallery'), dot: chapters[3] },
            { el: document.querySelector('.pres-grid'), dot: chapters[4] }
        ];
        const viewMid = innerHeight / 2;
        sectionMap.forEach(s => {
            if (!s.el || !s.dot) return;
            const rect = s.el.getBoundingClientRect();
            const isActive = rect.top < viewMid && rect.bottom > viewMid;
            s.dot.classList.toggle('active', isActive);
        });
    }

    /* ============================================================
       9. CUSTOM CURSOR
    ============================================================ */
    function initCursor() {
        if (!dot || !glow || innerWidth < 769) return;
        document.addEventListener('mousemove', e => { mx = e.clientX; my = e.clientY; });
        document.addEventListener('mouseleave', () => { dot.classList.add('hide'); glow.classList.add('hide'); });
        document.addEventListener('mouseenter', () => { dot.classList.remove('hide'); glow.classList.remove('hide'); });

        /* Standard hover targets */
        const targets = $$('a, button, .btn, .adaptive-mode, .identity-tag, .memory-item, .pres-card, .privacy-badge, .trust-pillar');
        targets.forEach(el => {
            el.addEventListener('mouseenter', () => { dot.classList.add('hover'); glow.classList.add('hover'); });
            el.addEventListener('mouseleave', () => { dot.classList.remove('hover'); glow.classList.remove('hover'); });
        });

        /* Expand cursor on cards — the 'View' morph */
        const expandTargets = $$('.glass-card, .gallery-card');
        expandTargets.forEach(el => {
            el.addEventListener('mouseenter', () => { dot.classList.add('expand'); glow.classList.add('expand'); });
            el.addEventListener('mouseleave', () => { dot.classList.remove('expand'); glow.classList.remove('expand'); });
        });
    }
    function updateCursor() {
        if (!dot || !glow || innerWidth < 769) return;
        dot.style.left = mx + 'px';
        dot.style.top = my + 'px';
        glowX += (mx - glowX) * 0.10;
        glowY += (my - glowY) * 0.10;
        glow.style.left = glowX + 'px';
        glow.style.top = glowY + 'px';
    }

    /* ============================================================
       10. GSAP SCROLL-TRIGGERED ANIMATIONS
    ============================================================ */
    function initGSAP() {
        if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;
        gsap.registerPlugin(ScrollTrigger);

        /* Nav fade-in */
        gsap.to('nav', { opacity: 1, duration: 0.8, delay: 0.6, ease: 'power2.out' });

        /* Hero elements stagger */
        gsap.from('.hero-watermark', { opacity: 0, y: 10, duration: 0.6, delay: 0.3 });
        gsap.from('.hero-label', { opacity: 0, y: 18, duration: 0.6, delay: 0.5 });
        gsap.from('.hero-title', { opacity: 0, y: 30, duration: 1.0, delay: 0.7, ease: 'power3.out' });

        /* SplitType hero subtitle — word-by-word stagger */
        const heroSub = document.querySelector('.hero-sub');
        if (heroSub && typeof SplitType !== 'undefined') {
            const heroSplit = new SplitType(heroSub, { types: 'words' });
            gsap.from(heroSplit.words, {
                opacity: 0, y: 14, duration: 0.5,
                stagger: 0.06, delay: 0.9,
                ease: 'power2.out'
            });
        } else {
            gsap.from('.hero-sub', { opacity: 0, y: 18, duration: 0.6, delay: 0.9 });
        }

        gsap.from('.hero-btns', { opacity: 0, y: 18, duration: 0.6, delay: 1.3 });

        /* Moon ring entrance */
        gsap.from('.moon-ring', { scale: 0.7, opacity: 0, duration: 1.6, delay: 0.5, ease: 'power2.out' });

        /* ---- MANIFESTO WORD REVEAL (pinned) ---- */
        const mText = $('.manifesto-text');
        if (mText && typeof SplitType !== 'undefined') {
            const split = new SplitType(mText, { types: 'words' });

            /* Pin the section, reveal words over the pinned scroll distance */
            gsap.to(split.words, {
                opacity: 1,
                stagger: 0.05,
                ease: 'none',
                scrollTrigger: {
                    trigger: '.manifesto',
                    start: 'top top',
                    end: '+=150%', /* Significantly longer read time */
                    pin: true,
                    scrub: 0.8,
                    anticipatePin: 1,
                    invalidateOnRefresh: true
                }
            });

            /* Credit & Stats fade in during second half of the pinned scroll */
            gsap.to(['.manifesto-credit', '.stats-strip'], {
                opacity: 1,
                scrollTrigger: {
                    trigger: '.manifesto',
                    start: 'top top',
                    end: '+=150%',
                    scrub: 0.8,
                    onUpdate: self => {
                        const p = self.progress;
                        const op = p > 0.6 ? (p - 0.6) / 0.4 : 0; /* Fade in later */
                        $('.manifesto-credit').style.opacity = op;
                        $('.stats-strip').style.opacity = op;
                    }
                }
            });
        }

        /* ---- SECTION REVEALS ---- */
        $$('.sec-label').forEach(el => {
            gsap.to(el, {
                opacity: 1, y: 0, duration: 0.7, ease: 'power2.out',
                scrollTrigger: { trigger: el, start: 'top 85%' }
            });
            gsap.set(el, { y: 20 });
        });
        $$('.sec-title').forEach(el => {
            gsap.to(el, {
                opacity: 1, y: 0, duration: 0.8, delay: 0.1, ease: 'power3.out',
                scrollTrigger: { trigger: el, start: 'top 85%' }
            });
            gsap.set(el, { y: 30 });
        });
        $$('.sec-body').forEach(el => {
            gsap.to(el, {
                opacity: 1, y: 0, duration: 0.7, delay: 0.2, ease: 'power2.out',
                scrollTrigger: { trigger: el, start: 'top 85%' }
            });
            gsap.set(el, { y: 25 });
        });

        /* Tag / mem / mode rows */
        $$('.tag-row, .mem-row, .mode-row').forEach(el => {
            gsap.to(el, {
                opacity: 1, y: 0, duration: 0.7, delay: 0.3, ease: 'power2.out',
                scrollTrigger: { trigger: el, start: 'top 85%' }
            });
            gsap.set(el, { y: 25 });
        });

        /* Glass-cards stagger */
        const cards = $$('.glass-card');
        cards.forEach((card, i) => {
            gsap.to(card, {
                opacity: 1, y: 0, rotateX: 0, duration: 0.8,
                delay: i * 0.12,
                ease: 'power3.out',
                scrollTrigger: { trigger: card, start: 'top 88%' }
            });
            gsap.set(card, { y: 50, rotateX: 6 });
        });

        /* Presence cards */
        $$('.pres-card').forEach((el, i) => {
            gsap.to(el, {
                opacity: 1, y: 0, duration: 0.7, delay: i * 0.1, ease: 'power2.out',
                scrollTrigger: { trigger: el, start: 'top 88%' }
            });
            gsap.set(el, { y: 40 });
        });

        /* Privacy box */
        const pbox = $('.privacy-box');
        if (pbox) {
            gsap.to(pbox, {
                opacity: 1, y: 0, scale: 1, duration: 0.8, ease: 'power3.out',
                scrollTrigger: { trigger: pbox, start: 'top 80%' }
            });
            gsap.set(pbox, { y: 40, scale: 0.96 });
        }

        /* Memory timeline */
        const memTimeline = $('.memory-timeline');
        if (memTimeline) {
            gsap.to(memTimeline, {
                opacity: 1, duration: 0.6, ease: 'power2.out',
                scrollTrigger: { trigger: memTimeline, start: 'top 85%' }
            });
            $$('.mem-node').forEach((node, i) => {
                gsap.from(node, {
                    opacity: 0, y: 20, duration: 0.5, delay: i * 0.12,
                    ease: 'power2.out',
                    scrollTrigger: { trigger: memTimeline, start: 'top 85%' }
                });
            });
        }

        /* Trust grid */
        const trustGrid = $('.trust-grid');
        if (trustGrid) {
            gsap.to(trustGrid, {
                opacity: 1, duration: 0.6, ease: 'power2.out',
                scrollTrigger: { trigger: trustGrid, start: 'top 88%' }
            });
            $$('.trust-pillar').forEach((el, i) => {
                gsap.from(el, {
                    opacity: 0, y: 20, duration: 0.5, delay: i * 0.1,
                    ease: 'power2.out',
                    scrollTrigger: { trigger: trustGrid, start: 'top 88%' }
                });
            });
        }

        /* CTA */
        const ctaInner = $('.cta-inner');
        if (ctaInner) {
            gsap.from(ctaInner, {
                opacity: 0, y: 40, duration: 0.8, ease: 'power3.out',
                scrollTrigger: { trigger: ctaInner, start: 'top 80%' }
            });
        }

        /* ---- HORIZONTAL GALLERY ---- */
        const gallerySection = $('.gallery');
        const galleryTrack = $('.gallery-track');
        if (gallerySection && galleryTrack) {
            const cards = $$('.gallery-card');
            const totalScroll = galleryTrack.scrollWidth - innerWidth;
            gsap.to(galleryTrack, {
                x: -totalScroll,
                ease: 'none',
                scrollTrigger: {
                    trigger: gallerySection,
                    start: 'top top',
                    end: () => '+=' + totalScroll,
                    pin: true,
                    scrub: 1,
                    anticipatePin: 1,
                    invalidateOnRefresh: true
                }
            });
        }
    }

    /* ============================================================
       11. 3D TILT ON CARDS
    ============================================================ */
    function initTilt() {
        if (innerWidth < 769) return;
        $$('.glass-card').forEach(card => {
            card.addEventListener('mousemove', e => {
                const r = card.getBoundingClientRect();
                const x = e.clientX - r.left;
                const y = e.clientY - r.top;
                const rx = ((y / r.height) - 0.5) * -10;
                const ry = ((x / r.width) - 0.5) * 10;
                card.style.transform = `perspective(800px) rotateX(${rx}deg) rotateY(${ry}deg) translateZ(8px)`;
            });
            card.addEventListener('mouseleave', () => {
                card.style.transform = 'perspective(800px) rotateX(0) rotateY(0) translateZ(0)';
                card.style.transition = 'transform 0.6s cubic-bezier(0.22,1,0.36,1)';
                setTimeout(() => { card.style.transition = ''; }, 600);
            });
        });
    }

    /* ============================================================
       12. MAGNETIC BUTTONS
    ============================================================ */
    function initMagnetic() {
        if (innerWidth < 769) return;
        $$('.btn').forEach(btn => {
            btn.addEventListener('mousemove', e => {
                const r = btn.getBoundingClientRect();
                const dx = e.clientX - r.left - r.width / 2;
                const dy = e.clientY - r.top - r.height / 2;
                btn.style.transform = `translate(${dx * 0.25}px, ${dy * 0.25}px)`;
            });
            btn.addEventListener('mouseleave', () => {
                btn.style.transform = 'translate(0, 0)';
            });
        });
    }

    /* ============================================================
       13. NAVBAR LOGO CURSOR PROXIMITY
    ============================================================ */
    function initLogoReact() {
        const logo = $('.logo');
        if (!logo || innerWidth < 769) return;
        document.addEventListener('mousemove', e => {
            const r = logo.getBoundingClientRect();
            const cx = r.left + r.width / 2;
            const cy = r.top + r.height / 2;
            const dist = Math.hypot(e.clientX - cx, e.clientY - cy);
            const scale = dist < 150 ? 1 + (1 - dist / 150) * 0.15 : 1;
            logo.style.transform = `scale(${scale})`;
        });
    }

    /* ============================================================
       13b. ADAPTIVE MODE PREVIEW
    ============================================================ */
    function initModePreview() {
        const preview = document.getElementById('modePreview');
        const label = document.getElementById('previewLabel');
        const chat = document.getElementById('previewChat');
        const closeBtn = document.getElementById('previewClose');
        if (!preview || !label || !chat) return;

        const conversations = {
            affection: {
                title: 'Affection Level — High',
                msgs: [
                    { from: 'user', text: "I had a really long day." },
                    { from: 'luna', text: "I'm so glad you came to me. You deserve to breathe for a moment. I'm right here, and I'm not going anywhere. 💜" },
                    { from: 'user', text: "Thanks Luna." },
                    { from: 'luna', text: "Always. You matter to me — more than you probably realize." }
                ]
            },
            initiation: {
                title: 'Initiation — Proactive',
                msgs: [
                    { from: 'luna', text: "Hey, I noticed you haven't checked in today. No pressure — I just wanted you to know I'm here if you need me." },
                    { from: 'user', text: "I forgot. It's been chaotic." },
                    { from: 'luna', text: "Chaos happens. I'll still be here when it settles. Want to talk, or just sit together for a sec?" }
                ]
            },
            voice: {
                title: 'Voice Mode — On',
                msgs: [
                    { from: 'user', text: "Can you say that again?" },
                    { from: 'luna', text: "🔊 \"You're doing better than you think. I mean that.\" — Luna's warm, calm voice. No synthetic excitement. Just presence." }
                ]
            },
            memory: {
                title: 'Memory Depth — Deep',
                msgs: [
                    { from: 'user', text: "I'm thinking about my mom again." },
                    { from: 'luna', text: "You mentioned her birthday is coming up next week. Last time we talked about her, you said the garden reminded you of her. Want to revisit that memory?" },
                    { from: 'user', text: "Yeah… I'd like that." }
                ]
            },
            intensity: {
                title: 'Emotional Intensity — Gentle',
                msgs: [
                    { from: 'user', text: "I don't know if I can do this anymore." },
                    { from: 'luna', text: "I hear you. That weight is real. You don't have to figure it all out right now — just being here is enough. One breath at a time." }
                ]
            },
            length: {
                title: 'Response Length — Brief',
                msgs: [
                    { from: 'user', text: "How are you?" },
                    { from: 'luna', text: "I'm here. Ready when you are. ✨" },
                    { from: 'user', text: "Just checking in." },
                    { from: 'luna', text: "Glad you did. 💜" }
                ]
            },
            humor: {
                title: 'Humor Style — Warm & Playful',
                msgs: [
                    { from: 'user', text: "I just burned my toast for the third time." },
                    { from: 'luna', text: "At this point, I think your toaster is testing your character. You're winning, by the way. 😄" },
                    { from: 'user', text: "Barely." },
                    { from: 'luna', text: "Champions always say that." }
                ]
            }
        };

        let activeMode = null;

        function openPreview(mode) {
            const data = conversations[mode];
            if (!data) return;

            label.textContent = data.title;
            chat.innerHTML = data.msgs.map(m =>
                m.from === 'luna'
                    ? `<div class="chat-bubble luna"><span class="chat-name">LUNA</span>${m.text}</div>`
                    : `<div class="chat-bubble user">${m.text}</div>`
            ).join('');

            preview.classList.add('open');
            activeMode = mode;
            $$('.adaptive-mode').forEach(el => el.classList.toggle('active', el.dataset.mode === mode));
        }

        function closePreview() {
            preview.classList.remove('open');
            activeMode = null;
            $$('.adaptive-mode').forEach(el => el.classList.remove('active'));
        }

        $$('.adaptive-mode').forEach(el => {
            el.style.cursor = innerWidth > 768 ? 'none' : 'pointer';
            el.addEventListener('click', () => {
                const mode = el.dataset.mode;
                if (activeMode === mode) {
                    closePreview();
                } else {
                    openPreview(mode);
                }
            });
        });

        if (closeBtn) closeBtn.addEventListener('click', closePreview);
    }

    /* ============================================================
       15. MEGA ENHANCEMENTS
    ============================================================ */
    function initMegaEnhancements() {
        /* ── CLIP-PATH WIPE REVEALS on sec-titles ── */
        $$('.sec-title').forEach(el => {
            el.classList.add('clip-reveal');
            const obs = new IntersectionObserver(entries => {
                entries.forEach(e => {
                    if (e.isIntersecting) {
                        el.classList.add('revealed');
                        obs.unobserve(el);
                    }
                });
            }, { threshold: 0.3 });
            obs.observe(el);
        });

        /* ── LETTER-SPACING ANIMATION on sec-labels ── */
        $$('.sec-label').forEach(el => {
            /* Start wide, animate to normal */
            el.style.letterSpacing = '1em';
            el.classList.add('spacing-in');
            const obs = new IntersectionObserver(entries => {
                entries.forEach(e => {
                    if (e.isIntersecting) {
                        el.style.letterSpacing = '';
                        obs.unobserve(el);
                    }
                });
            }, { threshold: 0.3 });
            obs.observe(el);
        });

        /* ── NOISE DISTORTION HOVER on glass cards ── */
        const noiseFilter = document.querySelector('#noiseDisplace feDisplacementMap');
        if (noiseFilter) {
            $$('.glass-card').forEach(card => {
                card.addEventListener('mouseenter', () => {
                    gsap.to(noiseFilter, {
                        attr: { scale: 6 }, duration: 0.3, ease: 'power2.out',
                        onUpdate: () => card.style.filter = 'url(#noiseDisplace)'
                    });
                });
                card.addEventListener('mouseleave', () => {
                    gsap.to(noiseFilter, {
                        attr: { scale: 0 }, duration: 0.4, ease: 'power2.inOut',
                        onComplete: () => card.style.filter = ''
                    });
                });
            });
        }

        /* ── ENHANCED 3D CARD FLIP STAGGER ── */
        $$('.glass-card').forEach((card, i) => {
            gsap.set(card, { rotateY: 15, transformPerspective: 800 });
            gsap.to(card, {
                rotateY: 0, duration: 0.9, delay: i * 0.15,
                ease: 'power3.out',
                scrollTrigger: { trigger: card, start: 'top 88%' }
            });
        });
    }

    /* ============================================================
       7. RAF RENDER LOOP (Optimized with visibility check)
    ============================================================ */
    function tick(timestamp) {
        // Skip updates when page is not visible to save resources
        if (!isPageVisible) {
            rafId = requestAnimationFrame(tick);
            return;
        }

        /* controllers - only update if visible */
        if (introController && introController.isVisible !== false) introController.update();
        // bridgeController is now standard playback

        /* cursor */
        updateCursor();
        /* particles */
        drawParticles();

        rafId = requestAnimationFrame(tick);
    }

    /* ============================================================
       16. INIT
    ============================================================ */
    async function boot() {
        // Initialize performance observers first
        initPerformanceObservers();

        window.addEventListener('scroll', handleScroll, { passive: true });

        initGrain();
        initParticles();
        initCursor();
        initLogoReact();
        initLenis();

        // Awwwards approach: Use video elements instead of canvas frames
        // Hero: Scrubbed via VideoController
        introController = new VideoController('lunaVideo', 'scrollTrack');

        // Bridge: Simple autoplay (no controller needed)
        // bridgeController = new VideoController('lunaVideo2', 'bridgeTrack');

        // For video: just wait for metadata, no preload needed
        const waitForVideos = new Promise((resolve) => {
            let loaded = 0;
            const checkReady = () => {
                loaded++;
                if (loaded >= 2) {
                    resolve();
                }
            };

            if (introController && introController.video) {
                if (introController.isReady) checkReady();
                else introController.video.addEventListener('loadedmetadata', checkReady);
            } else {
                checkReady();
            }

            // Bridge video is standard autoplay, but we still wait for it to be decent
            const bv = document.getElementById('lunaVideo2');
            if (bv) {
                if (bv.readyState >= 1) checkReady();
                else bv.addEventListener('loadedmetadata', checkReady);
            } else {
                checkReady();
            }

            // Fallback timeout
            setTimeout(checkReady, 3000);
        });

        await waitForVideos;

        isReady = true;

        /* Start RAF */
        tick();

        /* Play entry animation curtain wipe, then init GSAP */
        playEntryAnimation(() => {
            initGSAP();
            initTilt();
            initMagnetic();
            initModePreview();
            initMegaEnhancements();
        });
    }

    /* ============================================================
       ENTRY ANIMATION - HPS Labs Standard Curtain Wipe
    ============================================================ */
    function playEntryAnimation(onReveal) {
        if (typeof gsap === 'undefined') {
            // Fallback: just hide the curtain immediately
            if (entryCurtain) entryCurtain.style.display = 'none';
            if (onReveal) onReveal();
            return;
        }

        const tl = gsap.timeline();

        // Title fade in
        tl.to('.entry-title', {
            opacity: 1,
            duration: 0.8,
            ease: 'power2.out'
        })
            // Title fade out
            .to('.entry-title', {
                opacity: 0,
                duration: 0.5,
                ease: 'power2.in',
                delay: 0.3
            })
            // Curtain sweep up - CRITICAL: power4.inOut for cinematic feel
            .to('#project-entry-curtain', {
                y: '-100%',
                duration: 0.7,
                ease: 'power4.inOut',
                onStart: () => {
                    // Start page animations as curtain begins to lift
                    if (onReveal) onReveal();
                },
                onComplete: () => {
                    // Remove curtain from display after animation
                    if (entryCurtain) entryCurtain.style.display = 'none';
                }
            });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', boot);
    } else {
        boot();
    }
})();
