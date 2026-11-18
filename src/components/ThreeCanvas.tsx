import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

interface ThreeCanvasProps {
  intensity?: 'hero' | 'calm';
}

export const ThreeCanvas: React.FC<ThreeCanvasProps> = ({ intensity = 'hero' }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Respect prefers-reduced-motion
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }

    const container = containerRef.current;
    if (!container) return;

    // 1. Scene, Camera, Renderer
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      45,
      window.innerWidth / window.innerHeight,
      0.1,
      100
    );
    camera.position.z = 7;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'low-power' });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    container.appendChild(renderer.domElement);

    // 2. Gold Interlocking Rings (Symbol of two people connecting)
    const ringRadius = 1.35;
    const tubeRadius = 0.045;
    const ringGeometry = new THREE.TorusGeometry(ringRadius, tubeRadius, 24, 64);

    const goldMaterial1 = new THREE.MeshStandardMaterial({
      color: 0xE2B97A, // Champagne Gold
      roughness: 0.35,
      metalness: 0.85,
    });

    const goldMaterial2 = new THREE.MeshStandardMaterial({
      color: 0xD98A8F, // Soft Wine Rose
      roughness: 0.4,
      metalness: 0.75,
    });

    const ring1 = new THREE.Mesh(ringGeometry, goldMaterial1);
    ring1.position.x = -0.55;
    ring1.rotation.y = 0.4;
    scene.add(ring1);

    const ring2 = new THREE.Mesh(ringGeometry, goldMaterial2);
    ring2.position.x = 0.55;
    ring2.rotation.y = -0.4;
    scene.add(ring2);

    // 3. Floating Gold & Wine Dust Particles
    const particleCount = intensity === 'hero' ? 65 : 25;
    const particleGeometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount * 3; i += 3) {
      positions[i] = (Math.random() - 0.5) * 12;
      positions[i + 1] = (Math.random() - 0.5) * 10;
      positions[i + 2] = (Math.random() - 0.5) * 8;
    }

    particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const particleMaterial = new THREE.PointsMaterial({
      color: 0xE2B97A,
      size: 0.045,
      transparent: true,
      opacity: 0.65,
    });

    const particles = new THREE.Points(particleGeometry, particleMaterial);
    scene.add(particles);

    // 4. Lights
    const ambientLight = new THREE.AmbientLight(0xFFFFFF, 0.9);
    scene.add(ambientLight);

    const pointLight = new THREE.PointLight(0xE2B97A, 2.5, 20);
    pointLight.position.set(3, 4, 5);
    scene.add(pointLight);

    const backLight = new THREE.PointLight(0x8C1D2A, 3, 20);
    backLight.position.set(-3, -3, 3);
    scene.add(backLight);

    // 5. Gentle Parallax on Mouse
    let mouseX = 0;
    let mouseY = 0;
    let targetX = 0;
    let targetY = 0;

    const onMouseMove = (e: MouseEvent) => {
      mouseX = (e.clientX / window.innerWidth - 0.5) * 0.8;
      mouseY = (e.clientY / window.innerHeight - 0.5) * 0.8;
    };
    window.addEventListener('mousemove', onMouseMove, { passive: true });

    // 6. Responsive Resize
    const onResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', onResize);

    // 7. Animation Loop
    let animationFrameId: number;
    let clock = new THREE.Clock();

    const speedMultiplier = intensity === 'hero' ? 0.35 : 0.15;

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      const delta = clock.getDelta();
      const elapsed = clock.getElapsedTime() * speedMultiplier;

      // Soft rotation
      ring1.rotation.x = elapsed * 0.7;
      ring1.rotation.y = elapsed * 0.9;

      ring2.rotation.x = -elapsed * 0.6;
      ring2.rotation.y = -elapsed * 0.8;

      particles.rotation.y = elapsed * 0.15;

      // Mouse Parallax smoothing
      targetX += (mouseX - targetX) * 0.05;
      targetY += (mouseY - targetY) * 0.05;

      ring1.position.y = Math.sin(elapsed) * 0.15 - targetY * 0.3;
      ring2.position.y = -Math.sin(elapsed) * 0.15 - targetY * 0.3;

      camera.position.x = targetX * 0.5;
      camera.position.y = -targetY * 0.5;
      camera.lookAt(scene.position);

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('resize', onResize);
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
      ringGeometry.dispose();
      particleGeometry.dispose();
      goldMaterial1.dispose();
      goldMaterial2.dispose();
      particleMaterial.dispose();
    };
  }, [intensity]);

  return (
    <div 
      ref={containerRef} 
      className="fixed inset-0 pointer-events-none z-[1] transition-opacity duration-1000 opacity-80" 
      aria-hidden="true"
    />
  );
};
