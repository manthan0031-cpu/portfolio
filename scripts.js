/**
 * PORTFOLIO — PRODUCTION SCRIPTS
 * Modular, touch-aware, reduced-motion-safe
 */

(function() {
    'use strict';

    const CONFIG = {
        cursorLerp: 0.12,
        tiltLerp: 0.12,
        tiltMaxDeg: 6,
        magneticStrength: 0.15
    };

    const STATE = {
        isTouch: window.matchMedia('(pointer: coarse)').matches,
        reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
        menuOpen: false,
        cursorRaf: null,
        tiltRafs: new Map()
    };

    const DOM = {};
    let lenis;

    /* ==========================================
       DOM CACHE
       ========================================== */
    function cacheDOM() {
        DOM.cursorRing = document.getElementById('cursorRing');
        DOM.cursorDot = document.getElementById('cursorDot');
        DOM.nav = document.getElementById('nav');
        DOM.menuBtn = document.getElementById('menuBtn');
        DOM.menuOverlay = document.getElementById('menuOverlay');
        DOM.hamburger = document.getElementById('hamburger');
        DOM.menuLabel = document.getElementById('menuLabel');
        DOM.filterTabs = document.querySelectorAll('.filter-tab');
        DOM.cards = document.querySelectorAll('.card');
        DOM.disciplinesGrid = document.getElementById('disciplinesGrid');
        DOM.marqueeTrack = document.getElementById('marqueeTrack');
        DOM.marqueeItems = document.querySelectorAll('.marquee-item');
        DOM.sections = document.querySelectorAll('section[id]');
        DOM.navTabs = document.querySelectorAll('.nav-tab');
    }

    /* ==========================================
       CURSOR (Desktop Only)
       ========================================== */
    function initCursor() {
        if (STATE.isTouch || !DOM.cursorRing || !DOM.cursorDot) return;

        let targetX = 0, targetY = 0;
        let ringX = 0, ringY = 0;
        let dotX = 0, dotY = 0;

        document.addEventListener('mousemove', e => {
            targetX = e.clientX;
            targetY = e.clientY;
        }, { passive: true });

        function loop() {
            ringX += (targetX - ringX) * CONFIG.cursorLerp;
            ringY += (targetY - ringY) * CONFIG.cursorLerp;
            dotX += (targetX - dotX) * 0.25;
            dotY += (targetY - dotY) * 0.25;

            DOM.cursorRing.style.transform = `translate(${ringX}px, ${ringY}px) translate(-50%, -50%)`;
            DOM.cursorDot.style.transform = `translate(${dotX}px, ${dotY}px) translate(-50%, -50%)`;

            STATE.cursorRaf = requestAnimationFrame(loop);
        }
        loop();
    }


    /* ==========================================
       MAGNETIC BUTTONS (Desktop Only)
       ========================================== */
    function initMagnetic() {
        if (STATE.isTouch) return;

        document.querySelectorAll('[data-magnetic]').forEach(el => {
            el.addEventListener('mouseenter', () => {
                if (DOM.cursorRing) DOM.cursorRing.classList.add('hovering');
                if (DOM.cursorDot) DOM.cursorDot.classList.add('hovering');
            });

            el.addEventListener('mouseleave', () => {
                if (DOM.cursorRing) DOM.cursorRing.classList.remove('hovering');
                if (DOM.cursorDot) DOM.cursorDot.classList.remove('hovering');
                el.style.transition = 'transform 0.6s cubic-bezier(0.25, 1, 0.5, 1)';
                el.style.transform = 'translate(0,0)';
                setTimeout(() => { el.style.transition = ''; }, 600);
            });

            el.addEventListener('mousemove', e => {
                const r = el.getBoundingClientRect();
                const x = e.clientX - r.left - r.width / 2;
                const y = e.clientY - r.top - r.height / 2;
                el.style.transform = `translate(${x * CONFIG.magneticStrength}px, ${y * CONFIG.magneticStrength}px)`;
            }, { passive: true });
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
       FILTER TABS — MATHEMATICALLY ABSOLUTE
       ========================================== */
    function initFilters() {
        if (!DOM.filterTabs.length || !DOM.cards.length) return;

        // Ensure all cards visible by default
        gsap.set(DOM.cards, { opacity: 1, scale: 1 });

        DOM.filterTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                // Update active state
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
                            opacity: 1,
                            scale: 1,
                            duration: 0.5,
                            delay: i * 0.04,
                            ease: 'power3.out',
                            overwrite: 'auto',
                            onStart: () => { card.style.pointerEvents = 'auto'; }
                        });
                    } else {
                        gsap.to(card, {
                            opacity: 0.12,
                            scale: 0.96,
                            duration: 0.4,
                            ease: 'power3.inOut',
                            overwrite: 'auto',
                            onComplete: () => { card.style.pointerEvents = 'none'; }
                        });
                    }
                });
            });
        });
    }

    /* ==========================================
       BUTTERY 3D CARD TILT (Desktop Only)
       ========================================== */
    function initTilt() {
        if (STATE.isTouch) return;

        const tiltCards = document.querySelectorAll('.card, .expertise-card');
        tiltCards.forEach(card => {
            const inner = card.querySelector('.card-inner, .expertise-card-inner');
            if (!inner) return;

            const isExpertise = card.classList.contains('expertise-card');
            const scale = isExpertise ? 1.05 : 1.02;

            let targetRX = 0, targetRY = 0;
            let currentRX = 0, currentRY = 0;
            let rafId = null;
            let isHovering = false;

            function update() {
                currentRX += (targetRX - currentRX) * CONFIG.tiltLerp;
                currentRY += (targetRY - currentRY) * CONFIG.tiltLerp;

                if (isExpertise) {
                    inner.style.transform = `perspective(1000px) translate3d(0, -10px, 20px) rotateX(${currentRX}deg) rotateY(${currentRY}deg) scale(${scale})`;
                } else {
                    inner.style.transform = `perspective(1000px) rotateX(${currentRX}deg) rotateY(${currentRY}deg) scale3d(${scale}, ${scale}, ${scale})`;
                }

                const threshold = 0.01;
                const active = isHovering || 
                    Math.abs(targetRX - currentRX) > threshold || 
                    Math.abs(targetRY - currentRY) > threshold;

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
                const cx = r.width / 2;
                const cy = r.height / 2;
                targetRY = ((x - cx) / cx) * CONFIG.tiltMaxDeg;
                targetRX = -((y - cy) / cy) * CONFIG.tiltMaxDeg;
            }, { passive: true });

            card.addEventListener('mouseleave', () => {
                isHovering = false;
                targetRX = 0;
                targetRY = 0;
                if (!rafId) rafId = requestAnimationFrame(update);

                setTimeout(() => {
                    inner.style.transition = 'transform 0.6s cubic-bezier(0.25, 1, 0.5, 1)';
                    if (isExpertise) {
                        inner.style.transform = 'perspective(1000px) translate3d(0, 0, 0) rotateX(0) rotateY(0) scale(1)';
                    } else {
                        inner.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) scale3d(1, 1, 1)';
                    }
                    setTimeout(() => { inner.style.transition = ''; }, 600);
                }, 120);
            });
        });
    }

    /* ==========================================
       DISCIPLINES GRID ANIMATION
       ========================================== */
    function initDisciplines() {
        if (!DOM.disciplinesGrid) return;

        const items = document.querySelectorAll('.discipline-item');
        gsap.set(items, { y: 20, opacity: 0, filter: 'blur(4px)' });

        gsap.to(items, {
            scrollTrigger: {
                trigger: DOM.disciplinesGrid,
                start: 'top 85%',
                toggleActions: 'play none none none'
            },
            y: 0,
            opacity: 1,
            filter: 'blur(0px)',
            duration: 0.8,
            stagger: 0.05,
            ease: 'power3.out',
            onStart: () => {
                items.forEach((item, i) => {
                    const indexEl = item.querySelector('.discipline-index');
                    if (!indexEl) return;
                    const finalVal = i + 1;
                    const obj = { val: 0 };
                    gsap.to(obj, {
                        val: finalVal,
                        duration: 1.0 + i * 0.1,
                        ease: 'power2.out',
                        onUpdate: () => {
                            indexEl.textContent = String(Math.floor(obj.val)).padStart(2, '0');
                        }
                    });
                });
            }
        });
    }

    /* ==========================================
       MARQUEE INTERACTIONS
       ========================================== */
    function initMarquee() {
        // Keep it spinning, no pause on hover
    }

    /* ==========================================
       01.5 / AREA OF EXPERTISE ANIMATION (Fanning Cards)
       ========================================== */
    function initExpertiseCards() {
        if (STATE.reducedMotion) return;
        const section = document.getElementById('expertise');
        const cards = document.querySelectorAll('.expertise-card');
        if (!section || !cards.length) return;

        // Make sure ScrollTrigger is registered
        gsap.registerPlugin(ScrollTrigger);

        const mm = gsap.matchMedia();

        // Desktop fanning and flipping animation
        mm.add("(min-width: 769px)", () => {
            // Ensure 3D context on container and stack
            const stackContainer = section.querySelector('.cards-stack-container');
            const stack = section.querySelector('.cards-stack');
            if (stackContainer) {
                stackContainer.style.perspective = '1500px';
            }
            if (stack) {
                stack.style.transformStyle = 'preserve-3d';
            }

            // Pile offsets to make it look like a physical pile of cards placed backside up
            const stackOffsets = [
                { x: 5, y: -5, rZ: -3 },
                { x: -3, y: 3, rZ: 1.5 },
                { x: 2, y: -2, rZ: -1 },
                { x: 0, y: 0, rZ: 2 }
            ];

            // Pre-set cards to stacked, face-down (rotationY: -180) state
            cards.forEach((card, index) => {
                const offset = stackOffsets[index] || { x: 0, y: 0, rZ: 0 };
                gsap.set(card, {
                    xPercent: -50,
                    yPercent: -50,
                    x: offset.x,
                    y: offset.y,
                    rotationY: -180, // Start backside up
                    rotationZ: offset.rZ,
                    z: (index - 3) * 2, // Layer so index 3 (top card) is on top (z: 0) and index 0 is bottom (z: -6)
                    transformStyle: 'preserve-3d'
                });
            });

            // Horizontal fanned positions when face-up (centered mathematically around -50%)
            const spreads = [
                { xPercent: -215, yPercent: -50, rotateY: -15, rotateZ: -8 },
                { xPercent: -105, yPercent: -50, rotateY: -5,  rotateZ: -2.5 },
                { xPercent: 5,    yPercent: -50, rotateY: 5,   rotateZ: 2.5 },
                { xPercent: 115,  yPercent: -50, rotateY: 15,  rotateZ: 8 }
            ];

            // Variable Z peaks (drawing effect, top card drawn highest in 3D flight path)
            const zPeaks = [70, 110, 170, 240];

            // Create the scroll pin timeline
            const tl = gsap.timeline({
                scrollTrigger: {
                    trigger: section,
                    start: 'top top',
                    end: '+=1400',
                    scrub: 2.2, // Increased from 1.5 for buttery smooth inertia
                    pin: true,
                    anticipatePin: 1
                }
            });

            cards.forEach((card, index) => {
                const target = spreads[index];
                const offset = stackOffsets[index] || { x: 0, y: 0, rZ: 0 };
                const staggerDelay = (3 - index) * 0.15; // Top card peels and flips first, bottom card last

                tl.to(card, {
                    x: 0,
                    y: 0,
                    keyframes: [
                        {
                            z: zPeaks[index], // Dynamic drawing Z-lift card in 3D space
                            xPercent: (-50 + target.xPercent) / 2,
                            yPercent: (-50 + target.yPercent) / 2,
                            rotationY: -90, // Perpendicular midpoint
                            rotationZ: (offset.rZ + target.rotateZ) / 2,
                            duration: 0.4,
                            ease: 'power1.out'
                        },
                        {
                            z: index * 0.5, // Land back on horizontal plane with a small positive Z offset to prevent clipping/Z-fighting
                            xPercent: target.xPercent,
                            yPercent: target.yPercent,
                            rotationY: target.rotateY, // Turn forward up to target angle
                            rotationZ: target.rotateZ,
                            duration: 0.4,
                            ease: 'power1.inOut'
                        },
                        {
                            z: index * 0.5, // Align flat with a small positive Z offset to prevent clipping/Z-fighting
                            xPercent: target.xPercent,
                            yPercent: -50, // Straighten vertically
                            rotationY: 0,  // Align flat (facing camera directly)
                            rotationZ: 0,  // Align straight vertically
                            duration: 0.2,
                            ease: 'power2.out'
                        }
                    ],
                    duration: 0.8
                }, staggerDelay);
            });

            // Cleanup when media query no longer matches (resized to mobile)
            return () => {
                gsap.killTweensOf(cards);
                cards.forEach(card => {
                    gsap.set(card, { clearProps: "all" });
                });
            };
        });
    }

    /* ==========================================
       FOOTER TRANSITIONS (Dark background & Nav theme)
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
                // Transition html background to solid black; keep body transparent to prevent covering shaderBg
                gsap.to('html', { backgroundColor: '#000000', duration: 0.8, ease: 'power2.out' });
                gsap.set('body', { backgroundColor: 'transparent' });
                if (shaderBg) gsap.to(shaderBg, { opacity: 0, duration: 0.8, ease: 'power2.out' });
                if (footerShader) gsap.to(footerShader, { opacity: 0.15, duration: 0.8, ease: 'power2.out' }); // Subtle wave overlay
                if (nav) nav.classList.add('dark-nav');
            },
            onLeaveBack: () => {
                // Explicitly animate html background to #E8DDD4 to keep transition perfectly smooth and prevent snaps
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

        const vertexShader = `
            varying vec2 vUv;
            void main() {
                gl_Position = vec4(position, 1.0);
                vUv = uv;
            }
        `;

        const fragmentShader = `
            precision highp float;

            uniform vec2 u_resolution;
            uniform float u_time;
            uniform vec2 u_mouse;
            varying vec2 vUv;

            const float PI = 3.1415926535897932384626433832795;
            const float TAU = PI * 2.;

            void coswarp(inout vec3 trip, float warpsScale ){
                trip.xyz += warpsScale * .1 * cos(3. * trip.yzx + (u_time * .25));
                trip.xyz += warpsScale * .05 * cos(11. * trip.yzx + (u_time * .25));
                trip.xyz += warpsScale * .025 * cos(17. * trip.yzx + (u_time * .25));
            }

            void main() {
                vec2 uv = (gl_FragCoord.xy - u_resolution * .5) / u_resolution.yy + 0.5;

                // Add smooth interactive ripple centered around the mouse cursor
                vec2 mouse = u_mouse;
                float distToMouse = distance(uv, mouse);
                float ripple = sin(distToMouse * 15.0 - u_time * 4.0) * exp(-distToMouse * 3.5) * 0.18;
                uv += (uv - mouse) * ripple;

                float t = (u_time *.2) + length(fract((uv-.5) *10.));
                float t2 = (u_time *.1) + length(fract((uv-.5) *20.));

                vec2 uv2 = uv;
                vec3 w = vec3(uv.x, uv.y, 1.);
                coswarp(w, 3.);

                uv.x+= w.r;
                uv.y+= w.g;

                vec3 color = vec3(0., .5, uv2.x);
                color.r = sin(u_time *.2) + sin(length(uv-.5) * 10.);
                color.g = sin(u_time *.3) + sin(length(uv-.5) * 20.);

                coswarp(color, 3.);

                color = vec3(smoothstep(color.r, sin(t2), sin(t)));

                gl_FragColor = vec4(color, 1.0);
            }
        `;

        const material = new THREE.ShaderMaterial({
            uniforms,
            vertexShader,
            fragmentShader
        });

        const mesh = new THREE.Mesh(geometry, material);
        scene.add(mesh);

        const renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setPixelRatio(window.devicePixelRatio);
        container.appendChild(renderer.domElement);

        let mouse = new THREE.Vector2(0.5, 0.5);
        let targetMouse = new THREE.Vector2(0.5, 0.5);

        window.addEventListener('mousemove', (e) => {
            const rect = container.getBoundingClientRect();
            // Calculate normalized coordinate of the cursor inside the canvas
            const x = (e.clientX - rect.left) / rect.width;
            const y = 1.0 - (e.clientY - rect.top) / rect.height; // WebGL Y-axis is inverted
            
            targetMouse.x = Math.max(0.0, Math.min(1.0, x));
            targetMouse.y = Math.max(0.0, Math.min(1.0, y));
        }, { passive: true });

        const resize = () => {
            const w = container.clientWidth || window.innerWidth;
            const h = container.clientHeight || window.innerHeight;
            renderer.setSize(w, h);
            uniforms.u_resolution.value.x = renderer.domElement.width;
            uniforms.u_resolution.value.y = renderer.domElement.height;
        };

        window.addEventListener('resize', resize, { passive: true });
        resize();

        if (window.ResizeObserver) {
            const ro = new ResizeObserver(() => resize());
            ro.observe(container);
        }

        const clock = new THREE.Clock();
        const animate = () => {
            const rect = container.getBoundingClientRect();
            const isVisible = rect.bottom > 0 && rect.top < window.innerHeight;
            if (isVisible) {
                uniforms.u_time.value = clock.getElapsedTime();
                
                // Lerp mouse coordinate for buttery smooth delay effect
                mouse.x += (targetMouse.x - mouse.x) * 0.08;
                mouse.y += (targetMouse.y - mouse.y) * 0.08;
                uniforms.u_mouse.value.copy(mouse);

                renderer.render(scene, camera);
            }
            requestAnimationFrame(animate);
        };

        animate();
    }

    /* ==========================================
       INTERACTIVE CTA RINGS (Parallax Mouse Follow)
       ========================================== */
    function initInteractiveCtaRings() {
        if (STATE.isTouch) return;
        const ctaSection = document.querySelector('.cta-section');
        const ringWraps = document.querySelectorAll('.cta-bg-ring-wrap');
        if (!ctaSection || !ringWraps.length) return;

        // Animated target/current coordinates
        const strengths = [0.12, 0.07, 0.03]; // Parallax strengths for concentric rings
        const ringsState = Array.from(ringWraps).map((wrap, index) => ({
            el: wrap,
            factor: strengths[index] || 0.05,
            x: 0,
            y: 0,
            targetX: 0,
            targetY: 0
        }));

        ctaSection.addEventListener('mousemove', (e) => {
            const rect = ctaSection.getBoundingClientRect();
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;
            
            const dx = e.clientX - centerX;
            const dy = e.clientY - centerY;

            ringsState.forEach(ring => {
                ring.targetX = dx * ring.factor;
                ring.targetY = dy * ring.factor;
            });
        }, { passive: true });

        ctaSection.addEventListener('mouseleave', () => {
            ringsState.forEach(ring => {
                ring.targetX = 0;
                ring.targetY = 0;
            });
        });

        function updateRings() {
            ringsState.forEach(ring => {
                ring.x += (ring.targetX - ring.x) * 0.08;
                ring.y += (ring.targetY - ring.y) * 0.08;
                ring.el.style.transform = `translate(calc(-50% + ${ring.x}px), calc(-50% + ${ring.y}px))`;
            });
            requestAnimationFrame(updateRings);
        }

        updateRings();
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
            const nodes = Array.from(element.childNodes);
            nodes.forEach(node => {
                if (node.nodeType === 3) { // Text Node
                    const text = node.textContent;
                    const words = text.split(/(\s+)/);
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
                } else if (node.nodeType === 1) { // Element Node
                    if (node.tagName !== 'SPAN' || !node.classList.contains('blur-word')) {
                        wrapTextNodes(node);
                    }
                }
            });
        }
    }


    /* ==========================================
       GSAP ANIMATIONS
       ========================================== */
    /* ==========================================
       TEXT SPLITS FOR LUXURIOUS REVEALS
       ========================================== */
    function initTextSplits() {
        if (STATE.reducedMotion) return;

        const splitTextElements = document.querySelectorAll('.section-title, .about-headline, .expertise-title');
        splitTextElements.forEach(el => {
            const text = el.innerHTML.trim();
            const lines = text.split('<br>');
            el.innerHTML = lines.map(line => {
                return `<span class="line-mask" style="display:block; overflow:hidden; padding-bottom:0.18em; margin-bottom:-0.18em;"><span class="line-inner" style="display:block; opacity:0; will-change:transform, opacity; padding-bottom:0.18em; margin-bottom:-0.18em;">${line}</span></span>`;
            }).join('');
        });
    }

    /* ==========================================
       GSAP ANIMATIONS
       ========================================== */
    function initAnimations() {
        gsap.registerPlugin(ScrollTrigger);

        if (STATE.reducedMotion) {
            const selectors = [
                '#heroHeadline .line-inner',
                '#heroEyebrow span',
                '#heroSubline span',
                '#heroCta',
                '#scrollIndicator',
                '.card',
                '.process-step',
                '.about-inner > *',
                '.cta-inner > *',
                '.footer-inner > div'
            ];
            gsap.set(selectors, { clearProps: 'all', opacity: 1, y: 0, scale: 1, x: 0 });
            return;
        }

        // Hero entrance (cohesive, gorgeous fade-up animations)
        gsap.set('.nav', { y: -24, opacity: 0 });
        gsap.set('.hero-side-label', { y: 24, opacity: 0 });
        gsap.set('.float-preview.left', { x: -36, opacity: 0, rotate: -10 });
        gsap.set('.float-preview.right', { x: 36, opacity: 0, rotate: 10 });
        gsap.set('#heroEyebrow span', { y: 24, opacity: 0 });
        gsap.set('.word-animate', { y: 32, opacity: 0, scale: 0.94, filter: 'blur(8px)' });
        gsap.set('#heroSubline span', { y: 24, opacity: 0 });
        gsap.set('#heroCta', { y: 24, opacity: 0 });
        gsap.set('#scrollIndicator', { y: 20, opacity: 0 });

        const heroTl = gsap.timeline({ delay: 0.15 });
        heroTl
            // 1. Navigation slides down
            .to('.nav', { y: 0, opacity: 1, duration: 1.1, ease: 'power3.out' })
            
            // 2. Eyebrow slides up
            .to('#heroEyebrow span', { y: 0, opacity: 1, duration: 1.0, ease: 'power3.out' }, '-=0.9')
            
            // 3. Staggered words fade & slide up (fades up with blur/scale transition)
            .to('.word-animate', { 
                y: 0, 
                opacity: 1, 
                scale: 1, 
                filter: 'blur(0px)', 
                duration: 1.2, 
                stagger: 0.08, 
                ease: 'power3.out' 
            }, '-=0.8')

            // 5. Side labels fade up
            .to('.hero-side-label', { y: 0, opacity: 0.25, duration: 1.0, stagger: 0.08, ease: 'power3.out' }, '-=0.85')
            
            // 6. Previews slide in
            .to('.float-preview.left', { x: 0, opacity: 0.9, rotate: -6, duration: 1.3, ease: 'power3.out' }, '-=1.1')
            .to('.float-preview.right', { x: 0, opacity: 0.9, rotate: 4, duration: 1.3, ease: 'power3.out' }, '-=1.2')
            
            // 7. Subline and CTA fade up
            .to('#heroSubline span', { y: 0, opacity: 0.85, duration: 1.0, ease: 'power3.out' }, '-=1.1')
            .to('#heroCta', { y: 0, opacity: 1, duration: 1.0, ease: 'power3.out' }, '-=0.85')
            
            // 8. Scroll indicator slides up
            .to('#scrollIndicator', { y: 0, opacity: 1, duration: 0.8, ease: 'power2.out' }, '-=0.7');

        // Hero parallax
        gsap.to('#heroHeadline', {
            scrollTrigger: { trigger: '#hero', start: 'top top', end: 'bottom top', scrub: 1 },
            y: 100,
            opacity: 0.2,
            ease: 'none'
        });

        // Hero previews mousemove interactive drift (3D luxury depth)
        const hero = document.getElementById('hero');
        const leftPreview = document.querySelector('.float-preview.left');
        const rightPreview = document.querySelector('.float-preview.right');
        if (hero && leftPreview && rightPreview && !STATE.isTouch) {
            let targetX = 0, targetY = 0;
            let curXLeft = 0, curYLeft = 0;
            let curXRight = 0, curYRight = 0;
            
            hero.addEventListener('mousemove', (e) => {
                const cx = window.innerWidth / 2;
                const cy = window.innerHeight / 2;
                targetX = (e.clientX - cx) / cx;
                targetY = (e.clientY - cy) / cy;
            }, { passive: true });

            hero.addEventListener('mouseleave', () => {
                targetX = 0;
                targetY = 0;
            });

            const updateParallax = () => {
                curXLeft += (-targetX * 28 - curXLeft) * 0.05;
                curYLeft += (-targetY * 28 - curYLeft) * 0.05;
                
                curXRight += (targetX * 40 - curXRight) * 0.05;
                curYRight += (targetY * 40 - curYRight) * 0.05;

                leftPreview.style.transform = `translate3d(${curXLeft}px, ${curYLeft}px, 0) rotate(-6deg)`;
                rightPreview.style.transform = `translate3d(${curXRight}px, ${curYRight}px, 0) rotate(4deg)`;

                requestAnimationFrame(updateParallax);
            };
            updateParallax();
        }

        // Luxurious reveal timeline for section headers
        const revealHeader = (headerSelector, startTrigger = 'top 82%') => {
            const header = document.querySelector(headerSelector);
            if (!header) return;

            const label = header.querySelector('.section-label');
            const inners = header.querySelectorAll('.line-inner');
            const desc = header.querySelector('.section-desc, .about-body, .about-body + .about-body, .cta-btn');

            const tl = gsap.timeline({
                scrollTrigger: {
                    trigger: header,
                    start: startTrigger,
                    toggleActions: 'play none none none'
                }
            });

            if (label) {
                gsap.set(label, { y: 15, opacity: 0, filter: 'blur(4px)' });
                tl.to(label,
                    { y: 0, opacity: 0.45, filter: 'blur(0px)', duration: 0.8, ease: 'power3.out' }
                );
            }
            if (inners.length) {
                gsap.set(inners, { yPercent: 105, opacity: 0, filter: 'blur(8px)' });
                tl.to(inners,
                    { yPercent: 0, opacity: 1, filter: 'blur(0px)', duration: 1.2, stagger: 0.08, ease: 'power3.out' },
                    '-=0.6'
                );
            }
            if (desc) {
                const descs = header.parentNode.querySelectorAll('.section-desc, .about-body, .cta-btn');
                gsap.set(descs, { y: 20, opacity: 0, filter: 'blur(6px)' });
                tl.to(descs,
                    { y: 0, opacity: (i, el) => el.classList.contains('cta-btn') ? 1 : 0.6, filter: 'blur(0px)', duration: 1.2, stagger: 0.08, ease: 'power3.out' },
                    '-=0.8'
                );
            }
        };

        // Initialize header reveals
        revealHeader('#projects .section-header');
        revealHeader('#expertise .expertise-header');
        revealHeader('#about .about-inner > div:first-child');
        revealHeader('#process .process-inner .section-header');

        // Cards
        gsap.set('.card', { y: 80, opacity: 0, scale: 0.96, filter: 'blur(4px)' });
        gsap.to('.card', {
            scrollTrigger: { trigger: '.card-grid', start: 'top 85%', toggleActions: 'play none none none' },
            y: 0, opacity: 1, scale: 1, filter: 'blur(0px)', duration: 1.2, stagger: 0.08, ease: 'power3.out'
        });

        // About skills side reveal
        gsap.set('#about .about-inner > div:last-child > *', { y: 40, opacity: 0, filter: 'blur(4px)' });
        gsap.to('#about .about-inner > div:last-child > *', {
            scrollTrigger: { trigger: '#about', start: 'top 70%', toggleActions: 'play none none none' },
            y: 0, opacity: 1, filter: 'blur(0px)', duration: 1.2, stagger: 0.08, ease: 'power3.out'
        });

        // Process Steps Timeline & Reveal (scrubbed line fill, staggered card fade)
        const processMM = gsap.matchMedia();
        
        processMM.add("(min-width: 1024px)", () => {
            gsap.fromTo('.process-timeline-progress', 
                { width: '0%', height: '100%' }, 
                { 
                    width: '100%', 
                    scrollTrigger: {
                        trigger: '.process-steps',
                        start: 'top 75%',
                        end: 'bottom 65%',
                        scrub: 1
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
                        start: 'top 75%',
                        end: 'bottom 80%',
                        scrub: 1
                    }
                }
            );
        });

        gsap.set('.process-step', { y: 50, opacity: 0, scale: 0.96, filter: 'blur(4px)' });
        gsap.to('.process-step', {
            scrollTrigger: { trigger: '.process-steps', start: 'top 85%', toggleActions: 'play none none none' },
            y: 0, opacity: 1, scale: 1, filter: 'blur(0px)', duration: 1.2, stagger: 0.12, ease: 'power3.out'
        });

        // CTA
        gsap.set('.cta-inner > *', { y: 40, opacity: 0, filter: 'blur(6px)' });
        gsap.to('.cta-inner > *', {
            scrollTrigger: { trigger: '.cta-section', start: 'top 80%', toggleActions: 'play none none none' },
            y: 0, opacity: 1, filter: 'blur(0px)', duration: 1.2, stagger: 0.08, ease: 'power3.out'
        });

        // Footer items reveal
        gsap.set('.footer-inner > div', { y: 30, opacity: 0, filter: 'blur(4px)' });
        gsap.to('.footer-inner > div', {
            scrollTrigger: { trigger: '.footer', start: 'top 92%', toggleActions: 'play none none none' },
            y: 0, opacity: 1, filter: 'blur(0px)', duration: 1.2, stagger: 0.08, ease: 'power3.out'
        });
    }

    /* ==========================================
       LENIS SMOOTH SCROLLING
       ========================================== */
    function initLenis() {
        if (STATE.isTouch || STATE.reducedMotion) return;
        if (typeof Lenis === 'undefined') return;

        lenis = new Lenis({
            duration: 1.2,
            easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
            smoothWheel: true,
            smoothTouch: false
        });

        lenis.on('scroll', ScrollTrigger.update);

        gsap.ticker.add((time) => {
            lenis.raf(time * 1000);
        });

        gsap.ticker.lagSmoothing(0);
    }

    /* ==========================================
       HERO TO WORK SCROLL SNAP
       ========================================== */
    function initHeroScrollSnap() {
        if (STATE.isTouch || STATE.reducedMotion || !lenis) return;

        const expertise = document.getElementById('expertise');
        if (!expertise) return;

        let isSnapping = false;
        const navOffset = 80;

        window.addEventListener('wheel', e => {
            const scrollY = window.scrollY;
            const targetTop = expertise.offsetTop - navOffset;

            // Scroll down from Hero section: snap to Expertise section using Lenis
            if (scrollY < 30 && e.deltaY > 0 && !isSnapping) {
                isSnapping = true;
                e.preventDefault();
                lenis.scrollTo(expertise, {
                    offset: -navOffset,
                    duration: 1.4,
                    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
                    onComplete: () => { isSnapping = false; }
                });
            }

            // Scroll up from transition zone: snap back to Hero top using Lenis
            if (scrollY > 30 && scrollY < targetTop - 30 && e.deltaY < 0 && !isSnapping) {
                isSnapping = true;
                e.preventDefault();
                lenis.scrollTo(0, {
                    duration: 1.4,
                    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
                    onComplete: () => { isSnapping = false; }
                });
            }
        }, { passive: false });
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
            }, 250);
        }, { passive: true });
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
            // initCursor();
            initLenis();
            initMagnetic();
            initMenu();
            initNavScroll();
            initAnchors();
            initNavActive();
            initFilters();
            initTilt();
            initDisciplines();
            initMarquee();
            initInteractiveWordBlur();
            initTextSplits();
            initAnimations();
            initExpertiseCards();
            initFooterTransitions();
            initInteractiveCtaRings();
            initFooterShader();
            initHeroScrollSnap();
            initResizeHandler();
            setTimeout(() => {
                ScrollTrigger.refresh();
            }, 100);
            revealPage();
        } catch (e) {
            console.error("Init Error:", e);
            const errorDiv = document.createElement("div");
            errorDiv.style.position = "fixed";
            errorDiv.style.inset = "0";
            errorDiv.style.background = "#fff";
            errorDiv.style.color = "#ff0000";
            errorDiv.style.padding = "20px";
            errorDiv.style.zIndex = "999999";
            errorDiv.style.fontFamily = "monospace";
            errorDiv.style.fontSize = "16px";
            errorDiv.style.overflow = "auto";
            errorDiv.innerHTML = "<h1>Init Error:</h1><pre>" + e.stack + "</pre>";
            document.body.appendChild(errorDiv);
            revealPage();
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    window.addEventListener('load', () => {
        ScrollTrigger.refresh();
    });
})();
