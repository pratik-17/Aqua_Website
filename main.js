/* ============================================================
   AQUARIUS – Main App Initialization
   With Lenis Smooth Scroll
   ============================================================ */

(function () {
    'use strict';

    // --- Lenis Smooth Scroll ---
    let lenis;

    function initLenis() {
        if (typeof Lenis === 'undefined') return;

        lenis = new Lenis({
            duration: 1.4,
            easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
            orientation: 'vertical',
            gestureOrientation: 'vertical',
            smoothWheel: true,
            wheelMultiplier: 0.8,
            touchMultiplier: 1.5,
            infinite: false,
        });

        // Connect Lenis to GSAP ScrollTrigger
        lenis.on('scroll', (e) => {
            if (typeof ScrollTrigger !== 'undefined') {
                ScrollTrigger.update();
            }
            // Update Three.js scroll progress
            const max = document.documentElement.scrollHeight - window.innerHeight;
            const progress = max > 0 ? window.scrollY / max : 0;
            if (typeof OceanScene !== 'undefined' && OceanScene.setScrollProgress) {
                OceanScene.setScrollProgress(progress);
            }
        });

        // Use GSAP ticker for Lenis RAF
        if (typeof gsap !== 'undefined') {
            gsap.ticker.add((time) => {
                lenis.raf(time * 1000);
            });
            gsap.ticker.lagSmoothing(0);
        } else {
            // Fallback RAF loop
            function raf(time) {
                lenis.raf(time);
                requestAnimationFrame(raf);
            }
            requestAnimationFrame(raf);
        }
    }

    // --- Preloader ---
    const preloader = document.getElementById('preloader');
    const preloaderFill = document.getElementById('preloader-fill');

    let loadProgress = 0;
    const loadInterval = setInterval(() => {
        loadProgress += Math.random() * 15 + 5;
        if (loadProgress >= 100) {
            loadProgress = 100;
            clearInterval(loadInterval);
            setTimeout(() => {
                if (preloader) preloader.classList.add('hidden');
                setTimeout(() => {
                    Animations.init();
                }, 300);
            }, 400);
        }
        if (preloaderFill) {
            preloaderFill.style.width = loadProgress + '%';
        }
    }, 120);

    // --- Init ---
    document.addEventListener('DOMContentLoaded', () => {
        // Lenis smooth scroll
        initLenis();

        // Three.js scene
        OceanScene.init();

        // Interactions
        Interactions.init();

        // Smooth scroll for anchor links (via Lenis)
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', (e) => {
                e.preventDefault();
                const target = document.querySelector(anchor.getAttribute('href'));
                if (target) {
                    if (lenis) {
                        lenis.scrollTo(target, { offset: 0, duration: 1.6 });
                    } else {
                        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }
                }
            });
        });
    });

})();
