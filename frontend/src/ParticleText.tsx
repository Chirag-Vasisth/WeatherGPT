import React, { useRef, useEffect, useCallback, useState, forwardRef, useImperativeHandle } from 'react';

const COLORS = ['#0066cc', '#10b981', '#ef4444', '#8b5cf6', '#f97316'];

export interface ParticleTextHandle {
  toggleDrop: () => void;
  isFalling: boolean;
}

const ParticleText = forwardRef<ParticleTextHandle, any>(({
  text = 'WeatherGPT',
  fontSize = 110,
  gap = 5,
  particleSize = 2.5,
}, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const particlesRef = useRef<any[]>([]);
  const mouseRef = useRef({ x: -9999, y: -9999 });
  const animRef = useRef<number | null>(null);
  const fallingRef = useRef(false);
  const [value, setValue] = useState(text);
  const [isFalling, setIsFalling] = useState(false);

  // Sample the text into a grid of particles using an offscreen canvas.
  const buildParticles = useCallback(
    (canvas: HTMLCanvasElement, str: string) => {
      const width = canvas.width;
      const height = canvas.height;
      if (!width || !height) return;

      const off = document.createElement('canvas');
      off.width = width;
      off.height = height;
      const octx = off.getContext('2d');
      if (!octx) return;
      
      octx.clearRect(0, 0, width, height);
      octx.fillStyle = '#fff';

      let size = fontSize;
      octx.font = `900 ${size}px "Arial Black", Arial, sans-serif`;
      let textWidth = octx.measureText(str).width;
      const maxWidth = width * 0.9;
      if (textWidth > maxWidth && textWidth > 0) {
        size = Math.floor(size * (maxWidth / textWidth));
        octx.font = `900 ${size}px "Arial Black", Arial, sans-serif`;
        textWidth = octx.measureText(str).width;
      }
      octx.textBaseline = 'middle';
      octx.fillText(str, (width - textWidth) / 2, height / 2);

      const imgData = octx.getImageData(0, 0, width, height).data;
      const particles = [];
      for (let y = 0; y < height; y += gap) {
        for (let x = 0; x < width; x += gap) {
          const alphaIdx = (y * width + x) * 4 + 3;
          if (imgData[alphaIdx] > 128) {
            particles.push({
              x,
              y,
              homeX: x,
              homeY: y,
              vx: 0,
              vy: 0,
              color: COLORS[Math.floor(Math.random() * COLORS.length)],
              gravity: 0.25 + Math.random() * 0.35,
              drift: (Math.random() - 0.5) * 1.2,
              delay: Math.random() * 18,
            });
          }
        }
      }
      particlesRef.current = particles;
    },
    [fontSize, gap]
  );

  // (Re)build the particle grid whenever the text changes or the canvas resizes.
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const resize = () => {
      const rect = container.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
      buildParticles(canvas, value);
      fallingRef.current = false;
      setIsFalling(false);
    };

    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, [value, buildParticles]);

  // Animation loop: particles are repelled by the cursor and spring back home.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const REPEL_RADIUS = 90;
    const REPEL_STRENGTH = 6;
    const SPRING = 0.06;
    const FRICTION = 0.82;

    const step = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const particles = particlesRef.current;
      const mouse = mouseRef.current;

      const canvasHeight = canvas.height;

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        if (fallingRef.current) {
          // Exit animation: gravity takes over, staggered by each particle's delay.
          if (p.delay > 0) {
            p.delay -= 1;
          } else {
            p.vy += p.gravity;
            p.vx += p.drift * 0.02;
            p.vx *= 0.99;
            p.x += p.vx;
            p.y += p.vy;
          }

          if (p.y > canvasHeight + 20) continue; // fully fallen, skip drawing

          ctx.fillStyle = p.color;
          ctx.fillRect(p.x, p.y, particleSize, particleSize);
          continue;
        }

        const dx = p.x - mouse.x;
        const dy = p.y - mouse.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < REPEL_RADIUS) {
          const force = (1 - dist / REPEL_RADIUS) * REPEL_STRENGTH;
          const angle = Math.atan2(dy, dx);
          p.vx += Math.cos(angle) * force;
          p.vy += Math.sin(angle) * force;
        }

        p.vx += (p.homeX - p.x) * SPRING;
        p.vy += (p.homeY - p.y) * SPRING;
        p.vx *= FRICTION;
        p.vy *= FRICTION;
        p.x += p.vx;
        p.y += p.vy;

        ctx.fillStyle = p.color;
        ctx.fillRect(p.x, p.y, particleSize, particleSize);
      }

      animRef.current = requestAnimationFrame(step);
    };

    animRef.current = requestAnimationFrame(step);
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [particleSize]);

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    mouseRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const touch = e.touches[0];
    if (touch) {
      mouseRef.current = { x: touch.clientX - rect.left, y: touch.clientY - rect.top };
    }
  };

  const handleLeave = () => {
    mouseRef.current = { x: -9999, y: -9999 };
  };

  const handleDrop = () => {
    if (fallingRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;

    particlesRef.current.forEach((p) => {
      const dx = p.x - cx;
      const dy = p.y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;
      const nx = dx / dist;
      const ny = dy / dist;
      const burst = 2 + Math.random() * 4;

      p.vx = nx * burst + (Math.random() - 0.5) * 2;
      p.vy = ny * burst * 0.5 - Math.random() * 5 - 2;
    });
    fallingRef.current = true;
    setIsFalling(true);
  };

  const handleReset = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    buildParticles(canvas, value);
    fallingRef.current = false;
    setIsFalling(false);
  };

  useImperativeHandle(ref, () => ({
    toggleDrop: () => {
      if (isFalling) {
        handleReset();
      } else {
        handleDrop();
      }
    },
    isFalling
  }), [isFalling]);

  return (
    <div
      style={{
        width: '100%',
        minHeight: '480px',
        background: 'transparent',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '24px',
        padding: '24px',
        boxSizing: 'border-box',
      }}
    >
      <div
        ref={containerRef}
        style={{ width: '100%', maxWidth: '900px', height: '320px', position: 'relative' }}
      >
        <canvas
          ref={canvasRef}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleLeave}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleLeave}
          style={{ width: '100%', height: '100%', display: 'block' }}
        />
      </div>
    </div>
  );
});

export default ParticleText;
