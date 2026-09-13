import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

export default function ThreeCanvas() {
  const mountRef = useRef(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // 1. Scene, Camera, Renderer
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      42,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    );
    camera.position.set(0, 0, 11);

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // 2. Lighting System
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.8);
    scene.add(ambientLight);

    const greenLight = new THREE.PointLight(0x1dbf73, 4, 15);
    greenLight.position.set(2, 2, 4);
    scene.add(greenLight);

    const purpleLight = new THREE.PointLight(0x8b5cf6, 3, 15);
    purpleLight.position.set(-3, -2, 3);
    scene.add(purpleLight);

    // 3. Central Hub & Orbiting Elements Group
    const hubGroup = new THREE.Group();
    scene.add(hubGroup);

    // Central Glowing Emerald Sphere Core
    const coreGeo = new THREE.IcosahedronGeometry(1.6, 2);
    const coreMat = new THREE.MeshPhysicalMaterial({
      color: 0x1dbf73,
      metalness: 0.1,
      roughness: 0.2,
      transmission: 0.7,
      thickness: 1.0,
      clearcoat: 1.0,
      clearcoatRoughness: 0.1,
    });
    const coreMesh = new THREE.Mesh(coreGeo, coreMat);
    hubGroup.add(coreMesh);

    // Outer Wireframe Orbital Ring
    const wireGeo = new THREE.IcosahedronGeometry(1.7, 2);
    const wireMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      wireframe: true,
      transparent: true,
      opacity: 0.3,
    });
    const wireMesh = new THREE.Mesh(wireGeo, wireMat);
    coreMesh.add(wireMesh);

    // Torus Orbit Ring
    const ringGeo = new THREE.TorusGeometry(3.4, 0.03, 16, 100);
    const ringMat = new THREE.MeshStandardMaterial({
      color: 0x1dbf73,
      emissive: 0x1dbf73,
      emissiveIntensity: 0.4,
      roughness: 0.2,
    });
    const ringMesh = new THREE.Mesh(ringGeo, ringMat);
    ringMesh.rotation.x = Math.PI / 2.8;
    hubGroup.add(ringMesh);

    // 4. Helper Function for Canvas Texture Badges
    const createBadgeTexture = (title, subtitle, badgeColor, isPill = false) => {
      const canvas = document.createElement('canvas');
      canvas.width = 400;
      canvas.height = 140;
      const ctx = canvas.getContext('2d');

      // Rounded Card Background
      ctx.fillStyle = '#18181B';
      ctx.beginPath();
      ctx.roundRect(10, 10, 380, 120, isPill ? 60 : 20);
      ctx.fill();

      // Border glow
      ctx.strokeStyle = badgeColor || '#1DBF73';
      ctx.lineWidth = 4;
      ctx.stroke();

      // Dot Indicator
      ctx.fillStyle = badgeColor || '#1DBF73';
      ctx.beginPath();
      ctx.arc(45, 70, 12, 0, Math.PI * 2);
      ctx.fill();

      // Title Text
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 28px "Plus Jakarta Sans", sans-serif';
      ctx.fillText(title, 75, 62);

      // Subtitle Text
      if (subtitle) {
        ctx.fillStyle = '#A1A1AA';
        ctx.font = '500 20px "Plus Jakarta Sans", sans-serif';
        ctx.fillText(subtitle, 75, 94);
      }

      return new THREE.CanvasTexture(canvas);
    };

    // Badge 1: Revenue Metric Card
    const revMat = new THREE.MeshBasicMaterial({
      map: createBadgeTexture('$148,250 / mo', '+24% Agency Growth', '#1DBF73'),
      transparent: true,
    });
    const revCard = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 0.85), revMat);
    revCard.position.set(-2.2, 1.8, 0.8);
    hubGroup.add(revCard);

    // Badge 2: Auto Dispatch Card
    const dispatchMat = new THREE.MeshBasicMaterial({
      map: createBadgeTexture('Brief #F9842', 'Auto-Dispatched to Team', '#3B82F6'),
      transparent: true,
    });
    const dispatchCard = new THREE.Mesh(
      new THREE.PlaneGeometry(2.4, 0.85),
      dispatchMat
    );
    dispatchCard.position.set(2.1, 1.2, 0.6);
    hubGroup.add(dispatchCard);

    // Badge 3: Fiverr Pro Badge
    const proMat = new THREE.MeshBasicMaterial({
      map: createBadgeTexture('fiverr pro', 'Top Rated 99.8% On-Time', '#1DBF73', true),
      transparent: true,
    });
    const proCard = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 0.85), proMat);
    proCard.position.set(-1.8, -1.6, 1.0);
    hubGroup.add(proCard);

    // Badge 4: AVIS Partner Badge
    const avisMat = new THREE.MeshBasicMaterial({
      map: createBadgeTexture('AVIS', 'Enterprise Client', '#F59E0B', true),
      transparent: true,
    });
    const avisCard = new THREE.Mesh(new THREE.PlaneGeometry(2.1, 0.75), avisMat);
    avisCard.position.set(2.0, -1.7, 0.7);
    hubGroup.add(avisCard);

    // 5. Particle Constellation
    const particleCount = 200;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 20;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 20;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 15;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const particleMat = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.08,
      transparent: true,
      opacity: 0.5,
    });
    const particles = new THREE.Points(geometry, particleMat);
    scene.add(particles);

    // 6. Cursor Motion Listener
    let mouseX = 0;
    let mouseY = 0;

    const handleMouseMove = (e) => {
      const rect = container.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      mouseX = (x / container.clientWidth) * 2 - 1;
      mouseY = -(y / container.clientHeight) * 2 + 1;
    };

    window.addEventListener('mousemove', handleMouseMove);

    // 7. Animation Loop
    let animId;
    const clock = new THREE.Clock();

    const animate = () => {
      const elapsed = clock.getElapsedTime();

      // Core rotation
      coreMesh.rotation.y = elapsed * 0.4;
      coreMesh.rotation.x = elapsed * 0.2;
      ringMesh.rotation.z = elapsed * 0.3;

      // Floating sine wave animation for cards
      revCard.position.y = 1.8 + Math.sin(elapsed * 1.6) * 0.08;
      dispatchCard.position.y = 1.2 + Math.cos(elapsed * 1.8) * 0.08;
      proCard.position.y = -1.6 + Math.sin(elapsed * 2.0) * 0.09;
      avisCard.position.y = -1.7 + Math.cos(elapsed * 1.7) * 0.09;

      // Smooth inertia cursor tilt
      hubGroup.rotation.y = THREE.MathUtils.lerp(
        hubGroup.rotation.y,
        mouseX * 0.25,
        0.05
      );
      hubGroup.rotation.x = THREE.MathUtils.lerp(
        hubGroup.rotation.x,
        -mouseY * 0.15,
        0.05
      );

      renderer.render(scene, camera);
      animId = requestAnimationFrame(animate);
    };

    animate();

    const handleResize = () => {
      if (!container) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animId);
      if (container && renderer.domElement) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  return <div ref={mountRef} className="three-canvas-wrapper" />;
}
