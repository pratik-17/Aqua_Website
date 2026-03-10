/* ============================================================
   AQUARIUS – Interactions v4
   Sonar cursor, click ripples, card tilt, magnetic buttons,
   realistic bubble canvas
   ============================================================ */

const Interactions = (() => {

    let lastScrollY = 0;

    function init() {
        initSonarCursor();
        initRipple();
        initMagneticButtons();
        initCardTilt();
        initScrollVelocity();
        initBubbleCanvas();
    }

    // ── Sonar Cursor ──
    function initSonarCursor() {
        const cursor = document.getElementById('sonar-cursor');
        if (!cursor) return;

        // Hide on mobile
        if ('ontouchstart' in window) {
            cursor.style.display = 'none';
            document.body.style.cursor = 'auto';
            document.documentElement.style.cursor = 'auto';
            return;
        }

        let cx = window.innerWidth / 2;
        let cy = window.innerHeight / 2;
        let tx = cx, ty = cy;

        document.addEventListener('mousemove', (e) => {
            tx = e.clientX;
            ty = e.clientY;
        });

        function update() {
            cx += (tx - cx) * 0.15;
            cy += (ty - cy) * 0.15;
            cursor.style.left = cx + 'px';
            cursor.style.top = cy + 'px';
            requestAnimationFrame(update);
        }
        update();

        // Periodic sonar ping
        setInterval(() => {
            const ping = document.createElement('div');
            ping.className = 'sonar-ping';
            ping.style.left = cx + 'px';
            ping.style.top = cy + 'px';
            document.body.appendChild(ping);
            setTimeout(() => ping.remove(), 2000);
        }, 3500);
    }

    // ── Click Ripple ──
    function initRipple() {
        document.addEventListener('click', (e) => {
            const ripple = document.createElement('div');
            ripple.className = 'click-ripple';
            ripple.style.left = e.clientX + 'px';
            ripple.style.top = e.clientY + 'px';
            document.body.appendChild(ripple);
            setTimeout(() => {
                const r2 = document.createElement('div');
                r2.className = 'click-ripple';
                r2.style.left = e.clientX + 'px';
                r2.style.top = e.clientY + 'px';
                r2.style.animationDuration = '0.9s';
                document.body.appendChild(r2);
                setTimeout(() => r2.remove(), 900);
            }, 80);
            setTimeout(() => ripple.remove(), 700);
        });
    }

    // ── Magnetic Buttons ──
    function initMagneticButtons() {
        const wraps = document.querySelectorAll('.magnetic-wrap');
        wraps.forEach(wrap => {
            const btn = wrap.querySelector('.btn-glass');
            if (!btn) return;
            const radius = 80;

            wrap.addEventListener('mousemove', (e) => {
                const rect = wrap.getBoundingClientRect();
                const dx = e.clientX - (rect.left + rect.width / 2);
                const dy = e.clientY - (rect.top + rect.height / 2);
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < radius) {
                    const pull = 1 - dist / radius;
                    btn.style.transform = `translate(${dx * pull * 0.4}px, ${dy * pull * 0.4}px) scale(1.05)`;
                }
            });
            wrap.addEventListener('mouseleave', () => {
                btn.style.transform = 'translate(0,0) scale(1)';
                btn.style.transition = 'transform .5s cubic-bezier(.34,1.56,.64,1)';
                setTimeout(() => btn.style.transition = '', 500);
            });
        });
    }

    // ── 3D Card Tilt ──
    function initCardTilt() {
        const cards = document.querySelectorAll('.species-card');
        cards.forEach(card => {
            card.addEventListener('mousemove', (e) => {
                const rect = card.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                const rx = ((y - rect.height / 2) / (rect.height / 2)) * -8;
                const ry = ((x - rect.width / 2) / (rect.width / 2)) * 8;
                card.style.transform = `perspective(1000px) rotateX(${rx}deg) rotateY(${ry}deg) translateZ(10px)`;
            });
            card.addEventListener('mouseleave', () => {
                card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) translateZ(0)';
                card.style.transition = 'transform .6s cubic-bezier(.34,1.56,.64,1)';
                setTimeout(() => card.style.transition = 'transform .6s cubic-bezier(.34,1.56,.64,1),box-shadow .6s', 600);
            });
            card.addEventListener('mouseenter', () => card.style.transition = 'box-shadow .6s');
            card.addEventListener('click', () => {
                cards.forEach(c => c.classList.remove('active'));
                card.classList.add('active');
            });
        });
    }

    // ── Scroll Velocity ──
    function initScrollVelocity() {
        let lastTime = Date.now();
        window.addEventListener('scroll', () => {
            const now = Date.now();
            const dt = now - lastTime;
            if (dt > 0) {
                const vel = Math.abs(window.scrollY - lastScrollY) / dt;
                if (OceanScene && OceanScene.setParticleSpeed) OceanScene.setParticleSpeed(Math.min(vel * 2, 3));
            }
            lastScrollY = window.scrollY;
            lastTime = now;
        });
    }

    // ── Realistic Bubble Canvas (Guardians of the Deep section) ──
    function initBubbleCanvas() {
        const canvas = document.getElementById('jellyfish-canvas');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        let bubbles = [];
        let mx = 0, my = 0;
        let cRect;

        function resize() {
            cRect = canvas.parentElement.getBoundingClientRect();
            canvas.width = cRect.width;
            canvas.height = cRect.height;
        }
        window.addEventListener('resize', resize);
        resize();
        document.addEventListener('mousemove', (e) => {
            mx = e.clientX - cRect.left;
            my = e.clientY - cRect.top;
        });

        class Bubble {
            constructor() { this.reset(true); }
            reset(initial) {
                this.x = Math.random() * canvas.width;
                this.y = initial ? Math.random() * canvas.height : canvas.height + Math.random() * 60;
                this.radius = Math.random() * 14 + 3;
                this.vx = (Math.random() - 0.5) * 0.12;
                this.vy = -(Math.random() * 0.3 + 0.06);
                this.wobblePhase = Math.random() * Math.PI * 2;
                this.wobbleSpeed = Math.random() * 0.012 + 0.004;
                this.wobbleAmp = Math.random() * 1.0 + 0.2;
                this.opacity = Math.random() * 0.3 + 0.15;
            }
            update() {
                // Push away from mouse (like real bubbles)
                const dx = mx - this.x, dy = my - this.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < 120 && dist > 0) {
                    const force = (120 - dist) / 120 * 0.15;
                    this.x -= (dx / dist) * force;
                    this.y -= (dy / dist) * force;
                }
                this.wobblePhase += this.wobbleSpeed;
                this.x += this.vx + Math.sin(this.wobblePhase) * this.wobbleAmp * 0.06;
                this.y += this.vy;
                if (this.y < -this.radius * 3) this.reset(false);
            }
            draw(c) {
                const r = this.radius + Math.sin(this.wobblePhase * 0.6) * 0.6;
                const op = this.opacity;

                // Subtle glow around bubble
                c.save();
                c.beginPath();
                const glow = c.createRadialGradient(this.x, this.y, r * 0.4, this.x, this.y, r * 2.2);
                glow.addColorStop(0, `rgba(130, 195, 225, ${op * 0.35})`);
                glow.addColorStop(1, 'rgba(130, 195, 225, 0)');
                c.fillStyle = glow;
                c.arc(this.x, this.y, r * 2.2, 0, Math.PI * 2);
                c.fill();
                c.restore();

                // Bubble body — transparent center, visible edge (like real glass)
                c.save();
                c.beginPath();
                c.arc(this.x, this.y, r, 0, Math.PI * 2);
                const body = c.createRadialGradient(
                    this.x - r * 0.15, this.y - r * 0.15, r * 0.05,
                    this.x, this.y, r
                );
                body.addColorStop(0, `rgba(200, 230, 245, ${op * 0.15})`);
                body.addColorStop(0.5, `rgba(170, 215, 240, ${op * 0.3})`);
                body.addColorStop(0.8, `rgba(140, 195, 230, ${op * 0.7})`);
                body.addColorStop(1, `rgba(110, 175, 215, ${op * 0.9})`);
                c.fillStyle = body;
                c.fill();
                // Thin edge
                c.strokeStyle = `rgba(160, 210, 240, ${op * 0.7})`;
                c.lineWidth = 0.4;
                c.stroke();
                c.restore();

                // White specular highlight (upper-left)
                c.save();
                c.beginPath();
                const hx = this.x - r * 0.3, hy = this.y - r * 0.35;
                const hr = r * 0.22;
                const hl = c.createRadialGradient(hx, hy, 0, hx, hy, hr);
                hl.addColorStop(0, `rgba(255,255,255,${Math.min(op * 4, 0.8)})`);
                hl.addColorStop(1, 'rgba(255,255,255,0)');
                c.fillStyle = hl;
                c.arc(hx, hy, hr, 0, Math.PI * 2);
                c.fill();
                c.restore();

                // Secondary tiny rim highlight (bottom-right)
                c.save();
                c.beginPath();
                const rx2 = this.x + r * 0.2, ry2 = this.y + r * 0.3;
                const rr2 = r * 0.1;
                const rl = c.createRadialGradient(rx2, ry2, 0, rx2, ry2, rr2);
                rl.addColorStop(0, `rgba(210,235,255,${op * 1.0})`);
                rl.addColorStop(1, 'rgba(210,235,255,0)');
                c.fillStyle = rl;
                c.arc(rx2, ry2, rr2, 0, Math.PI * 2);
                c.fill();
                c.restore();
            }
        }

        for (let i = 0; i < 40; i++) bubbles.push(new Bubble());

        function loop() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            bubbles.forEach(b => { b.update(); b.draw(ctx); });
            requestAnimationFrame(loop);
        }

        const obs = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting) { loop(); obs.disconnect(); }
        }, { threshold: 0.1 });
        obs.observe(canvas.parentElement);
    }

    return { init };

})();
