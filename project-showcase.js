/**
 * PROJECT SHOWCASE PAGE — ANIMATION SCRIPTS
 * GSAP ScrollTrigger animations, stat counters, and interactive effects
 */

(function() {
    'use strict';

    const STATE = {
        isTouch: window.matchMedia('(pointer: coarse)').matches,
        reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches
    };

    /* ==========================================
       STAT COUNTER ANIMATION
       ========================================== */
    function initStatCounters() {
        const stats = document.querySelectorAll('.sidebar-stat .stat-number[data-count]');
        if (!stats.length) return;

        stats.forEach(stat => {
            const target = parseInt(stat.dataset.count, 10);
            const obj = { val: 0 };

            ScrollTrigger.create({
                trigger: stat,
                start: 'top 85%',
                once: true,
                onEnter: () => {
                    gsap.to(obj, {
                        val: target,
                        duration: 2.0,
                        ease: 'power2.out',
                        onUpdate: () => {
                            stat.textContent = Math.floor(obj.val);
                        }
                    });
                }
            });
        });
    }

    /* ==========================================
       CASE STUDY SECTION REVEALS
       ========================================== */
    function initCaseStudyReveals() {
        if (STATE.reducedMotion) {
            gsap.set([
                '.case-study-eyebrow', '.case-study-title .word-animate', 
                '.case-study-meta-grid > *', '.case-study-hero-img-wrap',
                '.study-heading', '.study-text', '.sidebar-stat',
                '.visual-card', '.feature-row', '.result-card',
                '.testimonial-block', '.next-project-inner'
            ], { opacity: 1, y: 0, scale: 1, clearProps: 'all' });
            return;
        }

        // Section headers
        document.querySelectorAll('.case-study-section-header').forEach(header => {
            const label = header.querySelector('.section-label-study');
            const heading = header.querySelector('.study-heading');

            gsap.set(label, { y: 12, opacity: 0 });
            gsap.set(heading, { y: 20, opacity: 0 });

            ScrollTrigger.create({
                trigger: header,
                start: 'top 85%',
                once: true,
                onEnter: () => {
                    gsap.to(label, { y: 0, opacity: 0.45, duration: 0.7, ease: 'power3.out' });
                    gsap.to(heading, { y: 0, opacity: 1, duration: 1.0, ease: 'power3.out', delay: 0.1 });
                }
            });
        });

        // Study text columns
        document.querySelectorAll('.study-text-col .study-text').forEach((text, i) => {
            gsap.set(text, { y: 24, opacity: 0 });
            ScrollTrigger.create({
                trigger: text,
                start: 'top 88%',
                once: true,
                onEnter: () => {
                    gsap.to(text, { y: 0, opacity: text.classList.contains('lead') ? 0.85 : 0.65, 
                        duration: 1.0, ease: 'power3.out', delay: i * 0.1 });
                }
            });
        });

        // Sidebar stats
        document.querySelectorAll('.sidebar-stat').forEach((stat, i) => {
            gsap.set(stat, { y: 20, opacity: 0 });
            ScrollTrigger.create({
                trigger: stat,
                start: 'top 88%',
                once: true,
                onEnter: () => {
                    gsap.to(stat, { y: 0, opacity: 1, duration: 0.8, ease: 'power3.out', delay: i * 0.12 });
                }
            });
        });

        // Visual cards
        document.querySelectorAll('.visual-card').forEach((card, i) => {
            gsap.set(card, { y: 40, opacity: 0, scale: 0.97 });
            ScrollTrigger.create({
                trigger: card,
                start: 'top 88%',
                once: true,
                onEnter: () => {
                    gsap.to(card, { y: 0, opacity: 1, scale: 1, 
                        duration: 1.0, ease: 'power3.out', delay: i * 0.1 });
                }
            });
        });

        // Feature rows
        document.querySelectorAll('.feature-row').forEach((row, i) => {
            const content = row.querySelector('.feature-content');
            const visual = row.querySelector('.feature-visual');

            gsap.set(content, { x: i % 2 === 0 ? -40 : 40, opacity: 0 });
            gsap.set(visual, { x: i % 2 === 0 ? 40 : -40, opacity: 0 });

            ScrollTrigger.create({
                trigger: row,
                start: 'top 80%',
                once: true,
                onEnter: () => {
                    gsap.to(content, { x: 0, opacity: 1, duration: 1.0, ease: 'power3.out' });
                    gsap.to(visual, { x: 0, opacity: 1, duration: 1.0, ease: 'power3.out', delay: 0.15 });
                }
            });
        });

        // Result cards
        document.querySelectorAll('.result-card').forEach((card, i) => {
            gsap.set(card, { y: 30, opacity: 0, scale: 0.97 });
            ScrollTrigger.create({
                trigger: card,
                start: 'top 88%',
                once: true,
                onEnter: () => {
                    gsap.to(card, { y: 0, opacity: 1, scale: 1, 
                        duration: 0.9, ease: 'power3.out', delay: i * 0.08 });
                }
            });
        });

        // Testimonial
        const testimonial = document.querySelector('.testimonial-block');
        if (testimonial) {
            gsap.set(testimonial, { y: 30, opacity: 0 });
            ScrollTrigger.create({
                trigger: testimonial,
                start: 'top 85%',
                once: true,
                onEnter: () => {
                    gsap.to(testimonial, { y: 0, opacity: 1, duration: 1.2, ease: 'power3.out' });
                }
            });
        }

        // Next project
        const nextProject = document.querySelector('.next-project-inner');
        if (nextProject) {
            gsap.set(nextProject, { y: 20, opacity: 0 });
            ScrollTrigger.create({
                trigger: nextProject,
                start: 'top 88%',
                once: true,
                onEnter: () => {
                    gsap.to(nextProject, { y: 0, opacity: 1, duration: 1.0, ease: 'power3.out' });
                }
            });
        }
    }

    /* ==========================================
       PARALLAX HERO IMAGE
       ========================================== */
    function initHeroParallax() {
        const heroImg = document.querySelector('.case-study-hero-img-wrap');
        if (!heroImg || STATE.isTouch) return;

        gsap.to(heroImg, {
            scrollTrigger: {
                trigger: '.case-study-hero',
                start: 'top top',
                end: 'bottom top',
                scrub: 1.5
            },
            y: 60,
            ease: 'none'
        });
    }

    /* ==========================================
       FEATURE VISUAL PARALLAX
       ========================================== */
    function initFeatureParallax() {
        if (STATE.isTouch) return;

        document.querySelectorAll('.feature-visual-inner').forEach(visual => {
            gsap.to(visual, {
                scrollTrigger: {
                    trigger: visual,
                    start: 'top 90%',
                    end: 'bottom 10%',
                    scrub: 1.5
                },
                y: -20,
                ease: 'none'
            });
        });
    }

    /* ==========================================
       NEXT PROJECT HOVER EFFECT
       ========================================== */
    function initNextProjectHover() {
        const nextLink = document.querySelector('.next-project-link');
        if (!nextLink || STATE.isTouch) return;

        const bg = document.querySelector('.next-project-bg');
        if (!bg) return;

        nextLink.addEventListener('mouseenter', () => {
            gsap.to(bg, { opacity: 0.12, duration: 0.8, ease: 'power2.out' });
        });

        nextLink.addEventListener('mouseleave', () => {
            gsap.to(bg, { opacity: 0.06, duration: 0.8, ease: 'power2.out' });
        });
    }

    /* ==========================================
       RESULT CARD INTERACTIONS
       ========================================== */
    function initResultCardInteractions() {
        document.querySelectorAll('.result-card').forEach(card => {
            const metric = card.querySelector('.result-metric');
            if (!metric) return;

            card.addEventListener('mouseenter', () => {
                gsap.to(metric, { 
                    scale: 1.05, 
                    color: '#FF6B35', 
                    duration: 0.4, 
                    ease: 'power2.out' 
                });
            });

            card.addEventListener('mouseleave', () => {
                gsap.to(metric, { 
                    scale: 1, 
                    color: '#FF6B35', 
                    duration: 0.4, 
                    ease: 'power2.out' 
                });
            });
        });
    }

    /* ==========================================
       VISUAL CARD CURSOR FOLLOW (Desktop)
       ========================================== */
    function initVisualCardCursor() {
        if (STATE.isTouch) return;

        document.querySelectorAll('.visual-card').forEach(card => {
            const img = card.querySelector('.visual-card-img-wrap img');
            if (!img) return;

            card.addEventListener('mousemove', e => {
                const rect = card.getBoundingClientRect();
                const x = (e.clientX - rect.left) / rect.width - 0.5;
                const y = (e.clientY - rect.top) / rect.height - 0.5;

                gsap.to(img, {
                    x: x * 15,
                    y: y * 15,
                    duration: 0.6,
                    ease: 'power2.out'
                });
            });

            card.addEventListener('mouseleave', () => {
                gsap.to(img, {
                    x: 0,
                    y: 0,
                    duration: 0.8,
                    ease: 'power2.out'
                });
            });
        });
    }

    /* ==========================================
       SCROLL PROGRESS BAR
       ========================================== */
    function initScrollProgress() {
        const bar = document.getElementById('scrollProgress');
        if (!bar) return;

        gsap.to(bar, {
            scaleX: 1,
            ease: 'none',
            scrollTrigger: {
                trigger: document.body,
                start: 'top top',
                end: 'bottom bottom',
                scrub: true
            }
        });
    }

    /* ==========================================
       BOOT
       ========================================== */
    function init() {
        gsap.registerPlugin(ScrollTrigger);

        initScrollProgress();
        initStatCounters();
        initCaseStudyReveals();
        initHeroParallax();
        initFeatureParallax();
        initNextProjectHover();
        initResultCardInteractions();
        initVisualCardCursor();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
