/* ============================================================
   AQUARIUS – Three.js Underwater Environment v5
   GLB shark model + realistic water environment
   ============================================================ */

const OceanScene = (() => {

  let scene, camera, renderer, clock;
  let sharkGroup;
  let sharkMixer; // AnimationMixer for GLB animations
  let particles, bubbles;
  let mouseX = 0, mouseY = 0;
  let scrollProgress = 0;

  // Shark roaming state
  let sharkState = {
    startX: 0, startY: 0, startZ: 0,
    endX: 0, endY: 0, endZ: 0,
    progress: 0,
    duration: 18,
    targetRotY: 0,
    swimTime: 0,
  };

  // ──────────────────────────────────────────────
  // LOAD GLB SHARK MODEL
  // ──────────────────────────────────────────────
  function loadSharkModel(onLoaded) {
    const loader = new THREE.GLTFLoader();
    loader.load(
      'models/shark.glb',
      (gltf) => {
        const model = gltf.scene;

        // Auto-scale: measure bounding box and scale to desired size
        const box = new THREE.Box3().setFromObject(model);
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        const desiredLength = 14; // 14 units long (massive shark)
        const scaleFactor = desiredLength / maxDim;
        model.scale.setScalar(scaleFactor);

        // Center the model
        const boxScaled = new THREE.Box3().setFromObject(model);
        const center = boxScaled.getCenter(new THREE.Vector3());
        model.position.sub(center);

        // Wrap in group for rotation/positioning
        const group = new THREE.Group();
        group.add(model);

        // Enhance materials for underwater look
        model.traverse((child) => {
          if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
            if (child.material) {
              // Darken slightly for deep water appearance
              if (child.material.map) {
                child.material.needsUpdate = true;
              }
            }
          }
        });

        // If GLB has animations, set up mixer
        if (gltf.animations && gltf.animations.length > 0) {
          sharkMixer = new THREE.AnimationMixer(model);
          // Play all animations (swim cycle, etc.)
          gltf.animations.forEach((clip) => {
            const action = sharkMixer.clipAction(clip);
            action.play();
          });
        }

        onLoaded(group);
      },
      // Progress
      (xhr) => {
        if (xhr.total > 0) {
          const pct = Math.round((xhr.loaded / xhr.total) * 100);
          console.log(`Shark model: ${pct}% loaded`);
        }
      },
      // Error fallback: build procedural shark
      (err) => {
        console.warn('GLB load failed, using procedural shark:', err);
        onLoaded(buildFallbackShark());
      }
    );
  }

  // Minimal procedural fallback shark (in case GLB fails to load)
  function buildFallbackShark() {
    const group = new THREE.Group();
    // Simple torpedo body
    const bodyGeo = new THREE.CylinderGeometry(0.15, 0.5, 4, 12);
    bodyGeo.rotateZ(Math.PI / 2);
    const bodyMat = new THREE.MeshPhongMaterial({
      color: 0x3a3e45, emissive: 0x0a0e15, shininess: 60,
    });
    group.add(new THREE.Mesh(bodyGeo, bodyMat));
    // Tail
    const tailGeo = new THREE.ConeGeometry(0.6, 1.2, 4);
    tailGeo.rotateZ(Math.PI / 2);
    const tail = new THREE.Mesh(tailGeo, bodyMat);
    tail.position.set(-2.2, 0, 0);
    group.add(tail);
    // Dorsal fin
    const finGeo = new THREE.ConeGeometry(0.15, 0.7, 4);
    const fin = new THREE.Mesh(finGeo, bodyMat);
    fin.position.set(0, 0.5, 0);
    group.add(fin);
    group.scale.set(2, 2, 2);
    return group;
  }

  // ──────────────────────────────────────────────
  // SPAWN RANDOM PATH
  // ──────────────────────────────────────────────
  function spawnPath() {
    // Alternate direction: next pass starts from where the current pass ends
    if (!sharkState.nextSpawnSide) sharkState.nextSpawnSide = Math.random() > 0.5 ? 'left' : 'right';
    const isLeftToRight = (sharkState.nextSpawnSide === 'left');
    sharkState.nextSpawnSide = isLeftToRight ? 'right' : 'left';

    // Fully randomized depth for both start and end (-40 is deep in fog, +15 is very close)
    // This allows it to swim from far away to close, close to far, or stay distant
    const startDepth = -40 + Math.random() * 55;
    const endDepth = -40 + Math.random() * 55;

    // Y is constant for this pass (strictly horizontal)
    const yPos = (Math.random() - 0.5) * 5 + 1;
    sharkState.startY = yPos;
    sharkState.endY = yPos;

    // Wide horizontal path cutting across the scene
    const spreadH = 45 + Math.random() * 10;

    if (isLeftToRight) {
      sharkState.startX = -spreadH;
      sharkState.endX = spreadH;
    } else {
      sharkState.startX = spreadH;
      sharkState.endX = -spreadH;
    }

    sharkState.startZ = startDepth;
    sharkState.endZ = endDepth;

    // Slow, heavy, massive shark logic (25-35 seconds)
    sharkState.duration = 25 + Math.random() * 10;
    sharkState.progress = 0;

    const angle = Math.atan2(
      sharkState.endX - sharkState.startX,
      sharkState.endZ - sharkState.startZ
    );
    sharkState.targetRotY = angle;

    if (sharkGroup) {
      // Clear rotational cache so it instantly faces the new direction
      sharkGroup.userData.baseRotY = angle;
      sharkGroup.position.set(sharkState.startX, sharkState.startY, sharkState.startZ);
    }
  }

  // ──────────────────────────────────────────────
  // WATER PARTICLES
  // ──────────────────────────────────────────────
  function createMarineSnow() {
    const count = 2500;
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 70;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 50;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 50;
    }
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    return new THREE.Points(geo, new THREE.PointsMaterial({
      color: 0x7090a0,
      size: 0.05,
      transparent: true,
      opacity: 0.3,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }));
  }

  // Realistic 3D Bubble System
  let bubbleGroup;
  function createBubbles() {
    bubbleGroup = new THREE.Group();
    bubbleGroup.name = 'bubbleGroup';
    const count = 80;
    const bubbleGeo = new THREE.SphereGeometry(1, 16, 12);

    for (let i = 0; i < count; i++) {
      const size = Math.random() * 0.08 + 0.02;
      const mat = new THREE.MeshPhongMaterial({
        color: 0xb0d8e8,
        emissive: 0x1a3040,
        emissiveIntensity: 0.05,
        transparent: true,
        opacity: 0.08 + Math.random() * 0.08,
        shininess: 200,
        specular: 0xffffff,
        reflectivity: 0.9,
        refractionRatio: 0.98,
        side: THREE.FrontSide,
        depthWrite: false,
      });
      const bubble = new THREE.Mesh(bubbleGeo, mat);
      bubble.scale.set(size, size * (0.9 + Math.random() * 0.2), size);
      bubble.position.set(
        (Math.random() - 0.5) * 50,
        (Math.random() - 0.5) * 45 - 5,
        (Math.random() - 0.5) * 25
      );
      bubble.userData = {
        speed: 0.008 + Math.random() * 0.015,
        wobbleX: Math.random() * Math.PI * 2,
        wobbleZ: Math.random() * Math.PI * 2,
        wobbleSpeedX: 0.3 + Math.random() * 0.6,
        wobbleSpeedZ: 0.2 + Math.random() * 0.5,
        wobbleAmpX: 0.002 + Math.random() * 0.005,
        wobbleAmpZ: 0.001 + Math.random() * 0.003,
        baseSize: size,
      };
      bubbleGroup.add(bubble);
    }
    return bubbleGroup;
  }

  // ──────────────────────────────────────────────
  // GOD RAYS (very subtle)
  // ──────────────────────────────────────────────
  let godRays = [];
  function createGodRay(x, z, w, op) {
    const geo = new THREE.CylinderGeometry(w * 0.1, w * 0.5, 50, 6, 1, true);
    const mat = new THREE.MeshBasicMaterial({
      color: 0x5588aa,
      transparent: true,
      opacity: op,
      blending: THREE.AdditiveBlending,
      side: THREE.FrontSide,
      depthWrite: false,
    });
    const r = new THREE.Mesh(geo, mat);
    r.position.set(x, 25, z);
    r.userData.baseOpacity = op;
    return r;
  }

  // ──────────────────────────────────────────────
  // INIT
  // ──────────────────────────────────────────────
  function init() {
    const canvas = document.getElementById('ocean-canvas');
    if (!canvas) return;

    clock = new THREE.Clock();
    scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x060a12, 0.028);

    camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 120);
    camera.position.set(0, 0, 14);

    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x060a12, 1);
    renderer.outputEncoding = THREE.sRGBEncoding; // Proper color for GLB textures
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.8; // Slightly dark for underwater

    // ── Lighting ──
    scene.add(new THREE.AmbientLight(0x1a2840, 0.9));

    const sun = new THREE.DirectionalLight(0x6699bb, 0.7);
    sun.position.set(3, 20, 8);
    scene.add(sun);

    const hemi = new THREE.HemisphereLight(0x2a4060, 0x020308, 0.5);
    scene.add(hemi);

    // Dramatic rim light for the shark
    const rimLight = new THREE.SpotLight(0x4477bb, 0.8, 50, Math.PI / 4, 0.5, 1);
    rimLight.position.set(-5, 5, -10);
    scene.add(rimLight);

    const backLight = new THREE.PointLight(0x223355, 0.4, 40);
    backLight.position.set(5, -3, 5);
    scene.add(backLight);

    // Fill light from below (ocean floor bounce)
    const fillLight = new THREE.PointLight(0x0a1825, 0.3, 30);
    fillLight.position.set(0, -8, 0);
    scene.add(fillLight);

    // ── God Rays ──
    [
      createGodRay(-3, -18, 0.8, 0.008),
      createGodRay(5, -22, 1.0, 0.006),
      createGodRay(-8, -15, 0.6, 0.005),
      createGodRay(10, -25, 0.9, 0.004),
      createGodRay(0, -20, 0.5, 0.005),
    ].forEach(r => { godRays.push(r); scene.add(r); });

    // ── LOAD THE SHARK (async) ──
    loadSharkModel((group) => {
      sharkGroup = group;
      scene.add(sharkGroup);
      spawnPath();
    });

    // ── Particles ──
    particles = createMarineSnow();
    scene.add(particles);

    bubbles = createBubbles();
    scene.add(bubbles);

    // Mouse
    window.addEventListener('mousemove', (e) => {
      mouseX = (e.clientX / window.innerWidth) * 2 - 1;
      mouseY = (e.clientY / window.innerHeight) * 2 - 1;
    });

    window.addEventListener('resize', onResize);
    animate();
  }

  function onResize() {
    if (!camera || !renderer) return;
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  }

  // ──────────────────────────────────────────────
  // ANIMATION LOOP
  // ──────────────────────────────────────────────
  function animate() {
    requestAnimationFrame(animate);
    const delta = clock.getDelta();
    const time = clock.getElapsedTime();

    // ── Update GLB animations ──
    if (sharkMixer) {
      sharkMixer.update(delta);
    }

    // ── Shark movement ──
    if (sharkGroup) {
      sharkState.progress += delta / sharkState.duration;
      sharkState.swimTime += delta;

      if (sharkState.progress >= 1) {
        spawnPath();
      } else {
        const t = sharkState.progress;
        const ease = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;

        const x = sharkState.startX + (sharkState.endX - sharkState.startX) * ease;
        const y = sharkState.startY + (sharkState.endY - sharkState.startY) * ease
          + Math.sin(sharkState.swimTime * 0.35) * 0.4;
        const z = sharkState.startZ + (sharkState.endZ - sharkState.startZ) * ease;

        sharkGroup.position.set(x, y, z);

        // Face direction of travel with procedural swim sway (prevents stiffness)
        if (sharkGroup.userData.baseRotY === undefined) {
          sharkGroup.userData.baseRotY = sharkState.targetRotY;
        }
        sharkGroup.userData.baseRotY += (sharkState.targetRotY - sharkGroup.userData.baseRotY) * 0.025;

        // Procedural swim wag (simulates tail power for rigid models)
        const swimSway = Math.sin(sharkState.swimTime * 3.5) * 0.08;
        sharkGroup.rotation.y = sharkGroup.userData.baseRotY + swimSway;

        // Subtle body roll combined with swim sway
        sharkGroup.rotation.z = Math.sin(sharkState.swimTime * 0.6) * 0.03 + (swimSway * 0.3);

        // Gentle pitch oscillation (nose up/down)
        sharkGroup.rotation.x = Math.sin(sharkState.swimTime * 0.4) * 0.02;
      }
    }

    // ── Marine snow ──
    if (particles) {
      const pos = particles.geometry.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        let y = pos.getY(i);
        y -= 0.005;
        if (y < -25) y = 25;
        pos.setY(i, y);
        pos.setX(i, pos.getX(i) + Math.sin(time * 0.15 + i * 0.03) * 0.0008);
      }
      pos.needsUpdate = true;
    }

    // ── Realistic Bubbles (3D sphere meshes) ──
    if (bubbleGroup) {
      bubbleGroup.children.forEach(b => {
        const d = b.userData;
        b.position.y += d.speed;
        d.wobbleX += d.wobbleSpeedX * delta;
        d.wobbleZ += d.wobbleSpeedZ * delta;
        b.position.x += Math.sin(d.wobbleX) * d.wobbleAmpX;
        b.position.z += Math.cos(d.wobbleZ) * d.wobbleAmpZ;
        const pulse = 1 + Math.sin(time * 1.5 + d.wobbleX) * 0.06;
        b.scale.setScalar(d.baseSize * pulse);
        if (b.position.y > 25) {
          b.position.y = -25;
          b.position.x = (Math.random() - 0.5) * 50;
          b.position.z = (Math.random() - 0.5) * 25;
        }
      });
    }

    // ── God rays ──
    godRays.forEach((ray, i) => {
      ray.material.opacity = ray.userData.baseOpacity + Math.sin(time * 0.2 + i * 1.3) * 0.002;
      ray.rotation.y = Math.sin(time * 0.05 + i) * 0.015;
    });

    // ── Camera: subtle parallax from mouse ──
    camera.position.x += (mouseX * 1.0 - camera.position.x) * 0.012;
    camera.position.y += (-mouseY * 0.5 - camera.position.y) * 0.012;

    const targetZ = 14 - scrollProgress * 4;
    camera.position.z += (targetZ - camera.position.z) * 0.02;
    camera.lookAt(0, 0, 0);

    // Fog on scroll
    scene.fog.density = 0.028 + scrollProgress * 0.012;

    // Darken on scroll
    const br = Math.max(0.024 - scrollProgress * 0.012, 0.008);
    const bg = Math.max(0.039 - scrollProgress * 0.02, 0.012);
    const bb = Math.max(0.07 - scrollProgress * 0.035, 0.025);
    renderer.setClearColor(new THREE.Color(br, bg, bb), 1);

    renderer.render(scene, camera);
  }

  function setScrollProgress(p) { scrollProgress = Math.max(0, Math.min(1, p)); }
  function setParticleSpeed(m) {
    if (particles) particles.material.opacity = Math.min(0.45, 0.3 + m * 0.06);
  }

  return { init, setScrollProgress, setParticleSpeed };

})();
