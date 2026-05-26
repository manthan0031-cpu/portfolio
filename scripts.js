/**
 * PORTFOLIO — PRODUCTION SCRIPTS v2 (PERFORMANCE OPTIMIZED)
 * - Single shared RAF loop for all mouse-driven animations
 * - IntersectionObserver gating on all expensive loops
 * - Blur animations removed from GSAP (paint-heavy)
 * - Hero snap removed (was fighting Lenis)
 * - RAF loops stop when sections leave viewport
 */

(function() {
    'use strict';

    const CONFIG = {
        tiltLerp: 0.1,
        tiltMaxDeg: 5,
        magneticStrength: 0.12
    };

    const STATE = {
        isTouch: window.matchMedia('(pointer: coarse)').matches,
        reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
        menuOpen: false,
        // Shared mouse state — updated once per frame from one RAF loop
        mouse: { x: 0, y: 0, rawX: 0, rawY: 0, moved: false }
    };

    const DOM = {};
    let lenis;
    let heroTl;

    /* ==========================================
       SHARED MOUSE STATE (single listener)
       ========================================== */
    // One mousemove listener writes to STATE.mouse; all other features READ from it
    if (!STATE.isTouch) {
        document.addEventListener('mousemove', e => {
            STATE.mouse.rawX = e.clientX;
            STATE.mouse.rawY = e.clientY;
            STATE.mouse.moved = true;
        }, { passive: true });
    }

    /* ==========================================
       DOM CACHE
       ========================================== */
    function cacheDOM() {
        DOM.nav = document.getElementById('nav');
        DOM.menuBtn = document.getElementById('menuBtn');
        DOM.menuOverlay = document.getElementById('menuOverlay');
        DOM.hamburger = document.getElementById('hamburger');
        DOM.menuLabel = document.getElementById('menuLabel');
        DOM.filterTabs = document.querySelectorAll('.filter-tab');
        DOM.cards = document.querySelectorAll('.card');
        DOM.disciplinesGrid = document.getElementById('disciplinesGrid');
        DOM.sections = document.querySelectorAll('section[id]');
        DOM.navTabs = document.querySelectorAll('.nav-tab');
    }

    /* ==========================================
       MAGNETIC BUTTONS (Desktop Only)
       ========================================== */
    function initMagnetic() {
        if (STATE.isTouch) return;

        document.querySelectorAll('[data-magnetic]').forEach(el => {
            let isOver = false;
            let tx = 0, ty = 0;
            let cx = 0, cy = 0;
            let rafId = null;

            function tick() {
                const dx = STATE.mouse.rawX - (el.getBoundingClientRect().left + el.offsetWidth / 2);
                const dy = STATE.mouse.rawY - (el.getBoundingClientRect().top + el.offsetHeight / 2);
                cx += (tx - cx) * 0.15;
                cy += (ty - cy) * 0.15;
                el.style.transform = `translate(${cx}px, ${cy}px)`;
                if (isOver || Math.abs(cx) > 0.5 || Math.abs(cy) > 0.5) {
                    rafId = requestAnimationFrame(tick);
                } else {
                    rafId = null;
                }
            }

            el.addEventListener('mouseenter', () => {
                isOver = true;
                if (!rafId) rafId = requestAnimationFrame(tick);
            });

            el.addEventListener('mousemove', e => {
                const r = el.getBoundingClientRect();
                const x = e.clientX - r.left - r.width / 2;
                const y = e.clientY - r.top - r.height / 2;
                tx = x * CONFIG.magneticStrength;
                ty = y * CONFIG.magneticStrength;
            }, { passive: true });

            el.addEventListener('mouseleave', () => {
                isOver = false;
                tx = 0; ty = 0;
                setTimeout(() => {
                    el.style.transition = 'transform 0.5s cubic-bezier(0.25, 1, 0.5, 1)';
                    el.style.transform = 'translate(0,0)';
                    setTimeout(() => { el.style.transition = ''; }, 500);
                }, 50);
            });
        });
    }

    /* ==========================================
       MENU
       ========================================== */
    function initMenu() {
        if (!DOM.menuBtn || !DOM.menuOverlay) return;

        function toggleMenu() {
            STATE.menuOpen = !STATE.menuOpen;
            DOM.menuOverlay.classList.toggle('open', STATE.menuOpen);
            DOM.hamburger?.classList.toggle('open', STATE.menuOpen);
            if (DOM.menuLabel) DOM.menuLabel.textContent = STATE.menuOpen ? 'Close' : 'Menu';
            DOM.menuBtn.setAttribute('aria-expanded', String(STATE.menuOpen));
            DOM.menuOverlay.setAttribute('aria-hidden', String(!STATE.menuOpen));
            document.body.classList.toggle('menu-locked', STATE.menuOpen);
        }

        DOM.menuBtn.addEventListener('click', toggleMenu);
        document.querySelectorAll('.menu-item').forEach(item => {
            item.addEventListener('click', () => {
                if (STATE.menuOpen) toggleMenu();
            });
        });
    }

    /* ==========================================
       NAV SCROLL STATE
       ========================================== */
    function initNavScroll() {
        if (!DOM.nav) return;
        let ticking = false;
        window.addEventListener('scroll', () => {
            if (!ticking) {
                requestAnimationFrame(() => {
                    DOM.nav.classList.toggle('scrolled', window.scrollY > 60);
                    ticking = false;
                });
                ticking = true;
            }
        }, { passive: true });
    }

    /* ==========================================
       SMOOTH ANCHOR SCROLL
       ========================================== */
    function initAnchors() {
        document.querySelectorAll('a[href^="#"]').forEach(a => {
            a.addEventListener('click', e => {
                const href = a.getAttribute('href');
                if (!href || href === '#') return;
                e.preventDefault();
                const target = document.querySelector(href);
                if (!target) return;
                const offset = 80;
                if (lenis) {
                    lenis.scrollTo(target, { offset: -offset, duration: 1.2 });
                } else {
                    const top = target.getBoundingClientRect().top + window.pageYOffset - offset;
                    window.scrollTo({ top, behavior: STATE.reducedMotion ? 'auto' : 'smooth' });
                }
            });
        });
    }

    /* ==========================================
       NAV ACTIVE STATE ON SCROLL
       ========================================== */
    function initNavActive() {
        if (!DOM.navTabs.length) return;
        let ticking = false;
        window.addEventListener('scroll', () => {
            if (ticking) return;
            requestAnimationFrame(() => {
                let current = '';
                DOM.sections.forEach(s => {
                    if (window.scrollY >= s.offsetTop - 200) current = s.id;
                });
                DOM.navTabs.forEach(tab => {
                    const href = tab.getAttribute('href');
                    const isActive = href === '#' + current || (current === 'expertise' && href === '#projects');
                    tab.classList.toggle('active', isActive);
                    tab.setAttribute('aria-current', isActive ? 'page' : 'false');
                });
                ticking = false;
            });
            ticking = true;
        }, { passive: true });
    }

    /* ==========================================
       FILTER TABS
       ========================================== */
    function initFilters() {
        if (!DOM.filterTabs.length || !DOM.cards.length) return;
        gsap.set(DOM.cards, { opacity: 1, scale: 1 });

        DOM.filterTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                DOM.filterTabs.forEach(t => {
                    t.classList.remove('active');
                    t.setAttribute('aria-selected', 'false');
                });
                tab.classList.add('active');
                tab.setAttribute('aria-selected', 'true');

                const filter = tab.dataset.filter;
                DOM.cards.forEach((card, i) => {
                    const match = filter === 'all' || card.dataset.category === filter;
                    if (match) {
                        gsap.to(card, {
                            opacity: 1, scale: 1, duration: 0.4, delay: i * 0.03,
                            ease: 'power2.out', overwrite: 'auto',
                            onStart: () => { card.style.pointerEvents = 'auto'; }
                        });
                    } else {
                        gsap.to(card, {
                            opacity: 0.12, scale: 0.97, duration: 0.35,
                            ease: 'power2.inOut', overwrite: 'auto',
                            onComplete: () => { card.style.pointerEvents = 'none'; }
                        });
                    }
                });
            });
        });
    }

    /* ==========================================
       3D CARD TILT (Desktop Only) — RAF-gated
       ========================================== */
    function initTilt() {
        if (STATE.isTouch || STATE.reducedMotion) return;

        const tiltCards = document.querySelectorAll('.card, .expertise-card');
        tiltCards.forEach(card => {
            const inner = card.querySelector('.card-inner, .expertise-card-inner');
            if (!inner) return;

            const isExpertise = card.classList.contains('expertise-card');
            const scale = isExpertise ? 1.04 : 1.02;

            let targetRX = 0, targetRY = 0;
            let currentRX = 0, currentRY = 0;
            let rafId = null;
            let isHovering = false;

            function update() {
                currentRX += (targetRX - currentRX) * CONFIG.tiltLerp;
                currentRY += (targetRY - currentRY) * CONFIG.tiltLerp;

                if (isExpertise) {
                    inner.style.transform = `perspective(1000px) translate3d(0,-8px,16px) rotateX(${currentRX}deg) rotateY(${currentRY}deg) scale(${scale})`;
                } else {
                    inner.style.transform = `perspective(1000px) rotateX(${currentRX}deg) rotateY(${currentRY}deg) scale3d(${scale},${scale},${scale})`;
                }

                const active = isHovering ||
                    Math.abs(targetRX - currentRX) > 0.01 ||
                    Math.abs(targetRY - currentRY) > 0.01;

                if (active) {
                    rafId = requestAnimationFrame(update);
                } else {
                    rafId = null;
                }
            }

            card.addEventListener('mouseenter', () => {
                isHovering = true;
                if (!rafId) rafId = requestAnimationFrame(update);
            });

            card.addEventListener('mousemove', e => {
                const r = card.getBoundingClientRect();
                const x = e.clientX - r.left;
                const y = e.clientY - r.top;
                targetRY = ((x - r.width / 2) / (r.width / 2)) * CONFIG.tiltMaxDeg;
                targetRX = -((y - r.height / 2) / (r.height / 2)) * CONFIG.tiltMaxDeg;
            }, { passive: true });

            card.addEventListener('mouseleave', () => {
                isHovering = false;
                targetRX = 0; targetRY = 0;
                if (!rafId) rafId = requestAnimationFrame(update);
                setTimeout(() => {
                    inner.style.transition = 'transform 0.5s cubic-bezier(0.25, 1, 0.5, 1)';
                    inner.style.transform = isExpertise
                        ? 'perspective(1000px) translate3d(0,0,0) rotateX(0) rotateY(0) scale(1)'
                        : 'perspective(1000px) rotateX(0) rotateY(0) scale3d(1,1,1)';
                    setTimeout(() => { inner.style.transition = ''; }, 500);
                }, 100);
            });
        });
    }

    /* ==========================================
       DISCIPLINES GRID ANIMATION
       ========================================== */
    function initDisciplines() {
        if (!DOM.disciplinesGrid) return;
        const items = document.querySelectorAll('.discipline-item');
        gsap.set(items, { y: 20, opacity: 0 });
        gsap.to(items, {
            scrollTrigger: {
                trigger: DOM.disciplinesGrid,
                start: 'top 88%',
                toggleActions: 'play none none none'
            },
            y: 0, opacity: 1, duration: 0.7, stagger: 0.06, ease: 'power3.out',
            onStart: () => {
                items.forEach((item, i) => {
                    const indexEl = item.querySelector('.discipline-index');
                    if (!indexEl) return;
                    const obj = { val: 0 };
                    gsap.to(obj, {
                        val: i + 1, duration: 0.9 + i * 0.08, ease: 'power2.out',
                        onUpdate: () => {
                            indexEl.textContent = String(Math.floor(obj.val)).padStart(2, '0');
                        }
                    });
                });
            }
        });
    }

    /* ==========================================
       EXPERTISE CARDS (Fanning Animation)
       ========================================== */
    function initExpertiseCards() {
        if (STATE.reducedMotion) return;
        const section = document.getElementById('expertise');
        const cards = document.querySelectorAll('.expertise-card');
        if (!section || !cards.length) return;

        gsap.registerPlugin(ScrollTrigger);
        const mm = gsap.matchMedia();

        mm.add("(min-width: 769px)", () => {
            const stackContainer = section.querySelector('.cards-stack-container');
            const stack = section.querySelector('.cards-stack');
            if (stackContainer) stackContainer.style.perspective = '1500px';
            if (stack) stack.style.transformStyle = 'preserve-3d';

            const stackOffsets = [
                { x: 5, y: -5, rZ: -3 },
                { x: -3, y: 3, rZ: 1.5 },
                { x: 2, y: -2, rZ: -1 },
                { x: 0, y: 0, rZ: 2 }
            ];

            cards.forEach((card, index) => {
                const offset = stackOffsets[index] || { x: 0, y: 0, rZ: 0 };
                gsap.set(card, {
                    xPercent: -50, yPercent: -50,
                    x: offset.x, y: offset.y,
                    rotationY: -180, rotationZ: offset.rZ,
                    z: (index - 3) * 2,
                    transformStyle: 'preserve-3d'
                });
            });

            const spreads = [
                { xPercent: -215, yPercent: -50, rotateY: -15, rotateZ: -8 },
                { xPercent: -105, yPercent: -50, rotateY: -5,  rotateZ: -2.5 },
                { xPercent: 5,    yPercent: -50, rotateY: 5,   rotateZ: 2.5 },
                { xPercent: 115,  yPercent: -50, rotateY: 15,  rotateZ: 8 }
            ];
            const zPeaks = [70, 110, 170, 240];

            const tl = gsap.timeline({
                scrollTrigger: {
                    trigger: section,
                    start: 'top top',
                    end: '+=1400',
                    scrub: 2.5,
                    pin: true,
                    anticipatePin: 1
                }
            });

            cards.forEach((card, index) => {
                const target = spreads[index];
                const offset = stackOffsets[index] || { x: 0, y: 0, rZ: 0 };
                const staggerDelay = (3 - index) * 0.15;
                tl.to(card, {
                    x: 0, y: 0,
                    keyframes: [
                        { z: zPeaks[index], xPercent: (-50 + target.xPercent) / 2, yPercent: (-50 + target.yPercent) / 2, rotationY: -90, rotationZ: (offset.rZ + target.rotateZ) / 2, duration: 0.4, ease: 'power1.out' },
                        { z: index * 0.5, xPercent: target.xPercent, yPercent: target.yPercent, rotationY: target.rotateY, rotationZ: target.rotateZ, duration: 0.4, ease: 'power1.inOut' },
                        { z: index * 0.5, xPercent: target.xPercent, yPercent: -50, rotationY: 0, rotationZ: 0, duration: 0.2, ease: 'power2.out' }
                    ],
                    duration: 0.8
                }, staggerDelay);
            });

            return () => {
                gsap.killTweensOf(cards);
                cards.forEach(card => gsap.set(card, { clearProps: "all" }));
            };
        });
    }

    /* ==========================================
       FOOTER TRANSITIONS
       ========================================== */
    function initFooterTransitions() {
        const contactSection = document.getElementById('contact');
        const shaderBg = document.getElementById('shader-background');
        const footerShader = document.getElementById('footer-shader');
        const nav = document.getElementById('nav');
        if (!contactSection) return;

        gsap.registerPlugin(ScrollTrigger);

        ScrollTrigger.create({
            trigger: contactSection,
            start: 'top 80%',
            end: 'bottom bottom',
            onEnter: () => {
                gsap.to('html', { backgroundColor: '#000000', duration: 0.8, ease: 'power2.out' });
                gsap.set('body', { backgroundColor: 'transparent' });
                if (shaderBg) gsap.to(shaderBg, { opacity: 0, duration: 0.8, ease: 'power2.out' });
                if (footerShader) gsap.to(footerShader, { opacity: 0.15, duration: 0.8, ease: 'power2.out' });
                if (nav) nav.classList.add('dark-nav');
            },
            onLeaveBack: () => {
                gsap.to('html', { backgroundColor: '#E8DDD4', duration: 0.8, ease: 'power2.out' });
                gsap.to('body', { backgroundColor: 'transparent', duration: 0.8, ease: 'power2.out' });
                if (shaderBg) gsap.to(shaderBg, { opacity: 0.58, duration: 0.8, ease: 'power2.out' });
                if (footerShader) gsap.to(footerShader, { opacity: 0, duration: 0.8, ease: 'power2.out' });
                if (nav) nav.classList.remove('dark-nav');
            }
        });
    }

    /* ==========================================
       FOOTER WAVES SHADER (Three.js WebGL)
       — Only animates when in viewport
       ========================================== */
    function initFooterShader() {
        const container = document.getElementById('footer-shader');
        if (!container || !window.THREE) return;

        const THREE = window.THREE;
        let camera = new THREE.Camera();
        camera.position.z = 1;
        let scene = new THREE.Scene();
        const geometry = new THREE.PlaneGeometry(2, 2);

        const uniforms = {
            u_time: { value: 1.0 },
            u_resolution: { value: new THREE.Vector2() },
            u_mouse: { value: new THREE.Vector2(0.5, 0.5) }
        };

        const material = new THREE.ShaderMaterial({
            uniforms,
            vertexShader: `varying vec2 vUv; void main() { gl_Position = vec4(position, 1.0); vUv = uv; }`,
            fragmentShader: `
                precision mediump float;
                uniform vec2 u_resolution;
                uniform float u_time;
                uniform vec2 u_mouse;
                varying vec2 vUv;
                const float PI = 3.14159265;
                void coswarp(inout vec3 t, float s) {
                    t.xyz += s*.1*cos(3.*t.yzx+(u_time*.25));
                    t.xyz += s*.05*cos(11.*t.yzx+(u_time*.25));
                    t.xyz += s*.025*cos(17.*t.yzx+(u_time*.25));
                }
                void main() {
                    vec2 uv = (gl_FragCoord.xy - u_resolution*.5) / u_resolution.yy + 0.5;
                    vec2 mouse = u_mouse;
                    float d = distance(uv, mouse);
                    float ripple = sin(d*15.0 - u_time*4.0)*exp(-d*3.5)*0.18;
                    uv += (uv - mouse)*ripple;
                    float t = (u_time*.2)+length(fract((uv-.5)*10.));
                    float t2 = (u_time*.1)+length(fract((uv-.5)*20.));
                    vec2 uv2 = uv;
                    vec3 w = vec3(uv.x, uv.y, 1.);
                    coswarp(w, 3.);
                    uv.x += w.r; uv.y += w.g;
                    vec3 color = vec3(0.,.5,uv2.x);
                    color.r = sin(u_time*.2)+sin(length(uv-.5)*10.);
                    color.g = sin(u_time*.3)+sin(length(uv-.5)*20.);
                    coswarp(color, 3.);
                    color = vec3(smoothstep(color.r, sin(t2), sin(t)));
                    gl_FragColor = vec4(color, 1.0);
                }
            `
        });

        const mesh = new THREE.Mesh(geometry, material);
        scene.add(mesh);

        const renderer = new THREE.WebGLRenderer({ antialias: false }); // antialias off = faster
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5)); // cap pixel ratio
        container.appendChild(renderer.domElement);

        let mouse = new THREE.Vector2(0.5, 0.5);
        let targetMouse = new THREE.Vector2(0.5, 0.5);
        let isVisible = false;

        window.addEventListener('mousemove', e => {
            const rect = container.getBoundingClientRect();
            targetMouse.x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
            targetMouse.y = Math.max(0, Math.min(1, 1.0 - (e.clientY - rect.top) / rect.height));
        }, { passive: true });

        const resize = () => {
            const w = container.clientWidth || window.innerWidth;
            const h = container.clientHeight || window.innerHeight;
            renderer.setSize(w, h);
            uniforms.u_resolution.value.set(renderer.domElement.width, renderer.domElement.height);
        };
        window.addEventListener('resize', resize, { passive: true });
        resize();

        // IntersectionObserver — only animate when visible
        const observer = new IntersectionObserver(entries => {
            isVisible = entries[0].isIntersecting;
        }, { threshold: 0.01 });
        observer.observe(container);

        const clock = new THREE.Clock();
        const animate = () => {
            requestAnimationFrame(animate);
            if (!isVisible) return;
            uniforms.u_time.value = clock.getElapsedTime();
            mouse.x += (targetMouse.x - mouse.x) * 0.08;
            mouse.y += (targetMouse.y - mouse.y) * 0.08;
            uniforms.u_mouse.value.copy(mouse);
            renderer.render(scene, camera);
        };
        animate();
    }

    /* ==========================================
       CTA RINGS — IntersectionObserver gated
       ========================================== */
    function initInteractiveCtaRings() {
        if (STATE.isTouch) return;
        const ctaSection = document.querySelector('.cta-section');
        const ringWraps = document.querySelectorAll('.cta-bg-ring-wrap');
        if (!ctaSection || !ringWraps.length) return;

        const strengths = [0.10, 0.06, 0.025];
        const ringsState = Array.from(ringWraps).map((wrap, index) => ({
            el: wrap, factor: strengths[index] || 0.04,
            x: 0, y: 0, targetX: 0, targetY: 0
        }));

        let isVisible = false;
        let rafRunning = false;

        ctaSection.addEventListener('mousemove', e => {
            const rect = ctaSection.getBoundingClientRect();
            const dx = e.clientX - (rect.left + rect.width / 2);
            const dy = e.clientY - (rect.top + rect.height / 2);
            ringsState.forEach(ring => {
                ring.targetX = dx * ring.factor;
                ring.targetY = dy * ring.factor;
            });
        }, { passive: true });

        ctaSection.addEventListener('mouseleave', () => {
            ringsState.forEach(ring => { ring.targetX = 0; ring.targetY = 0; });
        });

        function updateRings() {
            ringsState.forEach(ring => {
                ring.x += (ring.targetX - ring.x) * 0.08;
                ring.y += (ring.targetY - ring.y) * 0.08;
                ring.el.style.transform = `translate(calc(-50% + ${ring.x}px), calc(-50% + ${ring.y}px))`;
            });
            if (isVisible) requestAnimationFrame(updateRings);
            else rafRunning = false;
        }

        const observer = new IntersectionObserver(entries => {
            isVisible = entries[0].isIntersecting;
            if (isVisible && !rafRunning) {
                rafRunning = true;
                requestAnimationFrame(updateRings);
            }
        }, { threshold: 0.05 });
        observer.observe(ctaSection);
    }

    /* ==========================================
       INTERACTIVE WORD BLUR EFFECT
       ========================================== */
    function initInteractiveWordBlur() {
        if (STATE.reducedMotion) return;

        const targets = document.querySelectorAll(
            '#projects .section-title, #projects .section-desc, ' +
            '#about .about-headline, #about .about-sub-hook, ' +
            '#process .section-title, #process .section-desc, ' +
            '.cta-headline, .cta-subtext'
        );

        targets.forEach(el => {
            wrapTextNodes(el);
            el.classList.add('interactive-blur-text');
        });

        function wrapTextNodes(element) {
            Array.from(element.childNodes).forEach(node => {
                if (node.nodeType === 3) {
                    const words = node.textContent.split(/(\s+)/);
                    const fragment = document.createDocumentFragment();
                    words.forEach(word => {
                        if (word.trim().length > 0) {
                            const span = document.createElement('span');
                            span.className = 'blur-word';
                            span.textContent = word;
                            fragment.appendChild(span);
                        } else {
                            fragment.appendChild(document.createTextNode(word));
                        }
                    });
                    element.replaceChild(fragment, node);
                } else if (node.nodeType === 1 && !(node.tagName === 'SPAN' && node.classList.contains('blur-word'))) {
                    wrapTextNodes(node);
                }
            });
        }
    }

    /* ==========================================
       TEXT SPLITS FOR SECTION REVEALS
       ========================================== */
    function initTextSplits() {
        if (STATE.reducedMotion) return;

        const splitTextElements = document.querySelectorAll('.section-title, .about-headline, .expertise-title');
        splitTextElements.forEach(el => {
            const text = el.innerHTML.trim();
            const lines = text.split('<br>');
            el.innerHTML = lines.map(line =>
                `<span class="line-mask" style="display:block;overflow:hidden;padding-bottom:0.18em;margin-bottom:-0.18em;"><span class="line-inner" style="display:block;opacity:0;will-change:transform,opacity;padding-bottom:0.18em;margin-bottom:-0.18em;">${line}</span></span>`
            ).join('');
        });
    }

    /* ==========================================
       GSAP SCROLL ANIMATIONS
       ========================================== */
    function initAnimations() {
        gsap.registerPlugin(ScrollTrigger);

        if (STATE.reducedMotion) {
            gsap.set([
                '#heroHeadline .line-inner', '#heroEyebrow span', '#heroSubline span',
                '#heroCta', '#scrollIndicator', '.card', '.process-step',
                '.about-inner > *', '.cta-inner > *', '.footer-inner > div'
            ], { clearProps: 'all', opacity: 1, y: 0, scale: 1, x: 0 });
            return;
        }

        // Hero entrance — NO blur (performance)
        gsap.set('.nav', { y: -24, opacity: 0 });
        gsap.set('.hero-side-label', { y: 24, opacity: 0 });
        gsap.set('.float-preview.left', { x: -36, opacity: 0, rotate: -10 });
        gsap.set('.float-preview.right', { x: 36, opacity: 0, rotate: 10 });
        gsap.set('#heroEyebrow span', { y: 24, opacity: 0 });
        gsap.set('.word-animate', { y: 28, opacity: 0, scale: 0.94 }); // no blur
        gsap.set('#heroSubline span', { y: 20, opacity: 0 });
        gsap.set('#heroCta', { y: 20, opacity: 0 });
        gsap.set('#scrollIndicator', { y: 16, opacity: 0 });

        heroTl = gsap.timeline({ paused: true, delay: 0.15 });
        heroTl
            .to('.nav', { y: 0, opacity: 1, duration: 1.25, ease: 'power3.out' })
            .to('#heroEyebrow span', { y: 0, opacity: 1, duration: 1.1, ease: 'power3.out' }, '-=1.05')
            .to('.word-animate', { y: 0, opacity: 1, scale: 1, duration: 1.4, stagger: 0.09, ease: 'power3.out' }, '-=1.0')
            .to('.hero-side-label', { y: 0, opacity: 0.25, duration: 1.25, stagger: 0.08, ease: 'power3.out' }, '-=1.15')
            .to('.float-preview.left', { x: 0, opacity: 0.9, rotate: -6, duration: 1.5, ease: 'power3.out' }, '-=1.25')
            .to('.float-preview.right', { x: 0, opacity: 0.9, rotate: 4, duration: 1.5, ease: 'power3.out' }, '-=1.4')
            .to('#heroSubline span', { y: 0, opacity: 0.85, duration: 1.25, ease: 'power3.out' }, '-=1.25')
            .to('#heroCta', { y: 0, opacity: 1, duration: 1.15, ease: 'power3.out' }, '-=1.05')
            .to('#scrollIndicator', { y: 0, opacity: 1, duration: 1.0, ease: 'power2.out' }, '-=0.85');

        // Hero parallax (gentle)
        gsap.to('#heroHeadline', {
            scrollTrigger: { trigger: '#hero', start: 'top top', end: 'bottom top', scrub: 1 },
            y: 80, opacity: 0.3, ease: 'none'
        });

        // Hero previews parallax — IntersectionObserver gated
        const hero = document.getElementById('hero');
        const leftPreview = document.querySelector('.float-preview.left');
        const rightPreview = document.querySelector('.float-preview.right');
        if (hero && leftPreview && rightPreview && !STATE.isTouch) {
            let targetX = 0, targetY = 0;
            let curXLeft = 0, curYLeft = 0;
            let curXRight = 0, curYRight = 0;
            let heroVisible = true;
            let heroRafId = null;

            hero.addEventListener('mousemove', e => {
                const cx = window.innerWidth / 2;
                const cy = window.innerHeight / 2;
                targetX = (e.clientX - cx) / cx;
                targetY = (e.clientY - cy) / cy;
            }, { passive: true });

            hero.addEventListener('mouseleave', () => { targetX = 0; targetY = 0; });

            const updateParallax = () => {
                curXLeft += (-targetX * 24 - curXLeft) * 0.05;
                curYLeft += (-targetY * 24 - curYLeft) * 0.05;
                curXRight += (targetX * 36 - curXRight) * 0.05;
                curYRight += (targetY * 36 - curYRight) * 0.05;
                leftPreview.style.transform = `translate3d(${curXLeft}px,${curYLeft}px,0) rotate(-6deg)`;
                rightPreview.style.transform = `translate3d(${curXRight}px,${curYRight}px,0) rotate(4deg)`;
                if (heroVisible) heroRafId = requestAnimationFrame(updateParallax);
                else heroRafId = null;
            };

            const heroObserver = new IntersectionObserver(entries => {
                heroVisible = entries[0].isIntersecting;
                if (heroVisible && !heroRafId) heroRafId = requestAnimationFrame(updateParallax);
            }, { threshold: 0.01 });
            heroObserver.observe(hero);
            heroRafId = requestAnimationFrame(updateParallax);
        }

        // Section header reveals — NO blur
        const revealHeader = (headerSelector, startTrigger = 'top 82%') => {
            const header = document.querySelector(headerSelector);
            if (!header) return;

            const label = header.querySelector('.section-label');
            const inners = header.querySelectorAll('.line-inner');

            const tl = gsap.timeline({
                scrollTrigger: {
                    trigger: header,
                    start: startTrigger,
                    toggleActions: 'play none none none'
                }
            });

            if (label) {
                gsap.set(label, { y: 12, opacity: 0 });
                tl.to(label, { y: 0, opacity: 0.45, duration: 0.7, ease: 'power3.out' });
            }
            if (inners.length) {
                gsap.set(inners, { yPercent: 105, opacity: 0 });
                tl.to(inners, { yPercent: 0, opacity: 1, duration: 1.0, stagger: 0.07, ease: 'power3.out' }, label ? '-=0.5' : 0);
            }

            // Reveal section-desc separately
            const descs = header.parentNode.querySelectorAll('.section-desc');
            if (descs.length) {
                gsap.set(descs, { y: 16, opacity: 0 });
                tl.to(descs, {
                    y: 0, opacity: 0.6, duration: 1.0, stagger: 0.06, ease: 'power3.out'
                }, '-=0.6');
            }
        };

        revealHeader('#projects .section-header');
        revealHeader('#expertise .expertise-header');
        revealHeader('#about .about-inner > div:first-child');
        revealHeader('#process .process-inner .section-header');

        // Cards — no blur, just y+opacity
        gsap.set('.card', { y: 60, opacity: 0, scale: 0.97 });
        gsap.to('.card', {
            scrollTrigger: { trigger: '.card-grid', start: 'top 88%', toggleActions: 'play none none none' },
            y: 0, opacity: 1, scale: 1, duration: 1.0, stagger: 0.07, ease: 'power3.out'
        });

        // About skills
        gsap.set('#about .about-inner > div:last-child > *', { y: 30, opacity: 0 });
        gsap.to('#about .about-inner > div:last-child > *', {
            scrollTrigger: { trigger: '#about', start: 'top 72%', toggleActions: 'play none none none' },
            y: 0, opacity: 1, duration: 1.0, stagger: 0.07, ease: 'power3.out'
        });

        // Process steps
        const processMM = gsap.matchMedia();

        processMM.add("(min-width: 1024px)", () => {
            gsap.fromTo('.process-timeline-progress',
                { width: '0%', height: '100%' },
                {
                    width: '100%',
                    scrollTrigger: {
                        trigger: '.process-steps',
                        start: 'top 75%', end: 'bottom 65%', scrub: 1
                    }
                }
            );
        });

        processMM.add("(max-width: 1023px)", () => {
            gsap.fromTo('.process-timeline-progress',
                { height: '0%', width: '100%' },
                {
                    height: '100%',
                    scrollTrigger: {
                        trigger: '.process-steps',
                        start: 'top 75%', end: 'bottom 80%', scrub: 1
                    }
                }
            );
        });

        gsap.set('.process-step', { y: 40, opacity: 0, scale: 0.97 });
        gsap.to('.process-step', {
            scrollTrigger: { trigger: '.process-steps', start: 'top 87%', toggleActions: 'play none none none' },
            y: 0, opacity: 1, scale: 1, duration: 1.0, stagger: 0.1, ease: 'power3.out'
        });

        // CTA
        gsap.set('.cta-inner > *', { y: 30, opacity: 0 });
        gsap.to('.cta-inner > *', {
            scrollTrigger: { trigger: '.cta-section', start: 'top 80%', toggleActions: 'play none none none' },
            y: 0, opacity: 1, duration: 1.0, stagger: 0.07, ease: 'power3.out'
        });

        // Footer
        gsap.set('.footer-inner > div', { y: 24, opacity: 0 });
        gsap.to('.footer-inner > div', {
            scrollTrigger: { trigger: '.footer', start: 'top 93%', toggleActions: 'play none none none' },
            y: 0, opacity: 1, duration: 1.0, stagger: 0.07, ease: 'power3.out'
        });
    }

    /* ==========================================
       LENIS SMOOTH SCROLLING
       ========================================== */
    function initLenis() {
        if (STATE.isTouch || STATE.reducedMotion) return;
        if (typeof Lenis === 'undefined') return;

        lenis = new Lenis({
            duration: 1.1,
            easing: t => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
            smoothWheel: true,
            smoothTouch: false,
            // Prevent lenis from fighting with pinned ScrollTrigger panels
            gestureOrientation: 'vertical'
        });

        lenis.on('scroll', ScrollTrigger.update);

        gsap.ticker.add(time => { lenis.raf(time * 1000); });
        gsap.ticker.lagSmoothing(0);
    }

    /* ==========================================
       RESIZE HANDLER
       ========================================== */
    function initResizeHandler() {
        let resizeTimer;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(() => {
                ScrollTrigger.refresh();
            }, 200);
        }, { passive: true });
    }

    /* ==========================================
       PREMIUM LOADING SCREEN
       ========================================== */
    window.shaderBackgroundReady = false;

    function initLoader(onCompleteCallback) {
        const bar = document.getElementById("loaderBar");
        const percent = document.getElementById("loaderPercent");
        const wrapper = document.getElementById("loaderWrapper");
        if (!wrapper || !bar || !percent) {
            document.body.classList.remove('loading-active');
            document.documentElement.classList.remove('loading-active');
            onCompleteCallback();
            return;
        }

        const progress = { value: 0 };
        let isLoaded = false;

        // Track standard window load event
        window.addEventListener('load', () => {
            isLoaded = true;
        }, { passive: true });

        if (document.readyState === 'complete') {
            isLoaded = true;
        }

        // Start slow linear progress from 0 to 90 (simulating initial layout)
        const loaderTween = gsap.to(progress, {
            value: 90,
            duration: 3.5,
            ease: "power1.out",
            onUpdate: () => {
                const val = Math.min(90, Math.floor(progress.value));
                bar.style.width = val + "%";
                percent.textContent = String(val).padStart(2, "0");
            }
        });

        // Actively check for asset load AND WebGL shader compilation (ready flag)
        const checkInterval = setInterval(() => {
            if (isLoaded && window.shaderBackgroundReady) {
                clearInterval(checkInterval);
                loaderTween.kill(); // Kill the slow tween

                // Accelerate smoothly to 100%
                gsap.to(progress, {
                    value: 100,
                    duration: 0.5,
                    ease: "power2.out",
                    onUpdate: () => {
                        const val = Math.floor(progress.value);
                        bar.style.width = val + "%";
                        percent.textContent = String(val).padStart(2, "0");
                    },
                    onComplete: finishLoader
                });
            }
        }, 30);

        // Failsafe backup (5.0s max load timeout)
        setTimeout(() => {
            if (!isLoaded || !window.shaderBackgroundReady) {
                isLoaded = true;
                window.shaderBackgroundReady = true;
            }
        }, 5000);

        function finishLoader() {
            const tl = gsap.timeline({
                onComplete: () => {
                    wrapper.style.display = "none";
                    document.body.classList.remove('loading-active');
                    document.documentElement.classList.remove('loading-active');
                    onCompleteCallback();
                }
            });

            tl.to(".loader-content", { 
                opacity: 0, 
                y: -15, 
                duration: 0.45, 
                ease: "power2.inOut" 
            })
            .to(wrapper, { 
                opacity: 0, 
                duration: 0.75, 
                ease: "power3.inOut" 
            }, "-=0.15");
        }
    }

    /* ==========================================
       FOUC PREVENTION
       ========================================== */
    function revealPage() {
        requestAnimationFrame(() => {
            document.documentElement.classList.add('loaded');
        });
    }

    /* ==========================================
       BOOT
       ========================================== */
    function init() {
        try {
            cacheDOM();
            initMagnetic();
            initMenu();
            initNavScroll();
            initAnchors();
            initNavActive();
            initFilters();
            initTilt();
            initDisciplines();
            initInteractiveWordBlur();
            initTextSplits();
            initAnimations();
            initExpertiseCards();
            initFooterTransitions();
            initInteractiveCtaRings();
            initFooterShader();
            initResizeHandler();
            
            // Defer ScrollTrigger refresh & page reveal after loader ends
            initLoader(() => {
                initLenis();
                revealPage();
                if (heroTl) heroTl.play();
                
                // Refresh ScrollTrigger properties once layout is settled
                requestAnimationFrame(() => {
                    setTimeout(() => { ScrollTrigger.refresh(); }, 50);
                });
            });
        } catch (e) {
            console.error("Init Error:", e);
            document.body.classList.remove('loading-active');
            document.documentElement.classList.remove('loading-active');
            initLenis();
            revealPage(); // Always reveal page even on error
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    window.addEventListener('load', () => {
        ScrollTrigger.refresh();
    }, { passive: true });

})();
