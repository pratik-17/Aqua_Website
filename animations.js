/* ============================================================
   AQUARIUS – GSAP ScrollTrigger Animations
   ============================================================ */

const Animations = (() => {

    function init() {
        if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') {
            console.warn('GSAP or ScrollTrigger not loaded');
            return;
        }

        gsap.registerPlugin(ScrollTrigger);

        // Global scroll progress tracker
        ScrollTrigger.create({
            trigger: 'body',
            start: 'top top',
            end: 'bottom bottom',
            onUpdate: (self) => {
                if (OceanScene && OceanScene.setScrollProgress) {
                    OceanScene.setScrollProgress(self.progress);
                }
            }
        });

        initHero();
        initApexBiology();
        initGenomeVault();
        initEcoResonance();
        initBenthicZone();
        initCounters();
    }

    // --- Hero Section Animations ---
    function initHero() {
        const tl = gsap.timeline({
            defaults: { ease: 'power3.out' },
            delay: 0.3,
        });

        tl.to('.hero-label', {
            opacity: 1,
            y: 0,
            duration: 0.8,
        })
            .to('.hero-headline', {
                opacity: 0.85,
                duration: 1.2,
                ease: 'power2.out',
            }, '-=0.4')
            .to('.hero-subtitle', {
                opacity: 1,
                y: 0,
                duration: 0.8,
            }, '-=0.6')
            .to('.hero-cta', {
                opacity: 1,
                y: 0,
                duration: 0.8,
            }, '-=0.4');

        // Telemetry cards stagger
        gsap.utils.toArray('.telemetry-card').forEach((card, i) => {
            gsap.to(card, {
                opacity: 1,
                y: 0,
                duration: 0.8,
                delay: 1.2 + i * 0.15,
                ease: 'power3.out',
            });
        });

        // Hero parallax on scroll
        gsap.to('.hero-content', {
            scrollTrigger: {
                trigger: '.hero',
                start: 'top top',
                end: 'bottom top',
                scrub: 1.5,
            },
            y: -100,
            opacity: 0,
            scale: 0.95,
        });
    }

    // --- Apex Biology Section ---
    function initApexBiology() {
        // Ink reveal effect
        const inkElements = gsap.utils.toArray('.ink-reveal');
        inkElements.forEach((el, i) => {
            ScrollTrigger.create({
                trigger: el,
                start: 'top 85%',
                onEnter: () => {
                    gsap.to(el, {
                        delay: i * 0.15,
                        duration: 0,
                        onComplete: () => el.classList.add('revealed'),
                    });
                },
            });
        });

        // Image frame entrance
        gsap.from('.apex-image-frame', {
            scrollTrigger: {
                trigger: '.apex-biology',
                start: 'top 70%',
                end: 'center center',
                scrub: 2,
            },
            x: 80,
            opacity: 0,
            rotation: 3,
        });

        // Decorative ring
        gsap.from('.apex-decorative-ring', {
            scrollTrigger: {
                trigger: '.apex-biology',
                start: 'top 60%',
            },
            scale: 0,
            opacity: 0,
            duration: 1.5,
            ease: 'elastic.out(1, 0.5)',
        });
    }

    // --- Genome Vault (Gallery) ---
    function initGenomeVault() {
        // Header elements
        const vaultHeader = gsap.utils.toArray('#genome-vault .opacity-0');
        vaultHeader.forEach((el, i) => {
            gsap.to(el, {
                scrollTrigger: {
                    trigger: '#genome-vault',
                    start: 'top 80%',
                },
                opacity: 1,
                y: 0,
                duration: 0.8,
                delay: i * 0.15,
                ease: 'power3.out',
            });
        });

        // Species cards stagger
        const cards = gsap.utils.toArray('.species-card');
        cards.forEach((card, i) => {
            gsap.from(card, {
                scrollTrigger: {
                    trigger: '#genome-vault',
                    start: 'top 60%',
                },
                x: 60,
                opacity: 0,
                duration: 0.8,
                delay: i * 0.12,
                ease: 'power3.out',
            });
        });
    }

    // --- Ecological Resonance ---
    function initEcoResonance() {
        // Header elements
        const ecoHeader = gsap.utils.toArray('#eco-resonance .opacity-0');
        ecoHeader.forEach((el, i) => {
            gsap.to(el, {
                scrollTrigger: {
                    trigger: '#eco-resonance',
                    start: 'top 80%',
                },
                opacity: 1,
                y: 0,
                duration: 0.8,
                delay: i * 0.15,
                ease: 'power3.out',
            });
        });

        // Eco cards stagger
        const ecoCards = gsap.utils.toArray('.eco-card');
        ecoCards.forEach((card, i) => {
            gsap.to(card, {
                scrollTrigger: {
                    trigger: card,
                    start: 'top 85%',
                },
                opacity: 1,
                y: 0,
                duration: 0.8,
                delay: i * 0.1,
                ease: 'power3.out',
            });
        });
    }

    // --- Benthic Zone (Footer) ---
    function initBenthicZone() {
        gsap.from('.benthic-title', {
            scrollTrigger: {
                trigger: '.benthic-zone',
                start: 'top 80%',
            },
            y: 30,
            opacity: 0,
            duration: 1,
            ease: 'power3.out',
        });

        gsap.from('.benthic-tagline', {
            scrollTrigger: {
                trigger: '.benthic-zone',
                start: 'top 75%',
            },
            y: 20,
            opacity: 0,
            duration: 0.8,
            delay: 0.2,
            ease: 'power3.out',
        });

        // Coral rise from bottom
        gsap.from('.benthic-floor', {
            scrollTrigger: {
                trigger: '.benthic-zone',
                start: 'top 90%',
                end: 'center center',
                scrub: 2,
            },
            y: 100,
            opacity: 0,
        });

        // Links stagger
        gsap.from('.benthic-link', {
            scrollTrigger: {
                trigger: '.benthic-links',
                start: 'top 90%',
            },
            y: 15,
            opacity: 0,
            duration: 0.5,
            stagger: 0.1,
            ease: 'power3.out',
        });
    }

    // --- Animated Counters ---
    function initCounters() {
        const counterEls = document.querySelectorAll('[data-count]');
        counterEls.forEach(el => {
            const target = parseInt(el.dataset.count, 10);
            const suffix = el.textContent.replace(/[0-9]/g, '').trim();

            ScrollTrigger.create({
                trigger: el,
                start: 'top 85%',
                once: true,
                onEnter: () => {
                    gsap.to({ val: 0 }, {
                        val: target,
                        duration: 2,
                        ease: 'power2.out',
                        onUpdate: function () {
                            el.textContent = Math.floor(this.targets()[0].val) + (target >= 100 ? '+' : '');
                        },
                    });
                },
            });
        });
    }

    return { init };

})();
