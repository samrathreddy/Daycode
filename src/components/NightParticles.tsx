import React, { useEffect, useRef } from 'react';
import { useTheme } from "@/hooks/useTheme";

interface Particle {
  x: number;
  y: number;
  size: number;
  speedY: number;
  opacity: number;
  life: number;
  maxLife: number;
}

export function NightParticles() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { theme } = useTheme();

  // Only render particles in dark mode
  if (theme !== 'dark') {
    return null;
  }

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas to full screen
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    // Call resize initially and on window resize
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const particles: Particle[] = [];
    const maxParticles = 60; // Adjust for more or fewer particles

    // Create initial particles
    for (let i = 0; i < maxParticles; i++) {
      createParticle();
    }

    function createParticle(): Particle {
      // Random position at the bottom of the screen
      const x = Math.random() * canvas.width;
      const y = canvas.height + Math.random() * 20;
      
      // Random size (very small)
      const size = Math.random() * 2 + 0.5;
      
      // Random upward speed
      const speedY = Math.random() * 0.7 + 0.1;
      
      // Random opacity for twinkling effect
      const opacity = Math.random() * 0.6 + 0.2;
      
      // Life counter for fading
      const maxLife = Math.random() * 500 + 300;
      
      const particle = {
        x,
        y,
        size,
        speedY,
        opacity,
        life: 0,
        maxLife
      };
      
      particles.push(particle);
      return particle;
    }

    function updateParticles() {
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        
        // Move particle upward
        p.y -= p.speedY;
        
        // Increment life
        p.life += 1;
        
        // Remove particles that are off screen or expired
        if (p.y < -10 || p.life >= p.maxLife) {
          particles.splice(i, 1);
          createParticle();
        }
      }
    }

    function drawParticles() {
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Draw each particle
      particles.forEach(p => {
        // Calculate fade in/out based on life
        let fadeOpacity = p.opacity;
        if (p.life < 50) {
          // Fade in
          fadeOpacity = (p.life / 50) * p.opacity;
        } else if (p.life > p.maxLife - 50) {
          // Fade out
          fadeOpacity = ((p.maxLife - p.life) / 50) * p.opacity;
        }
        
        // Draw particle with glow effect
        ctx.beginPath();
        
        // Add glow effect
        const gradient = ctx.createRadialGradient(
          p.x, p.y, 0,
          p.x, p.y, p.size * 2
        );
        
        gradient.addColorStop(0, `rgba(255, 255, 210, ${fadeOpacity})`);
        gradient.addColorStop(1, `rgba(255, 255, 210, 0)`);
        
        ctx.fillStyle = gradient;
        ctx.arc(p.x, p.y, p.size * 2, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw the central bright spot
        ctx.beginPath();
        ctx.fillStyle = `rgba(255, 255, 255, ${fadeOpacity * 1.5})`;
        ctx.arc(p.x, p.y, p.size / 2, 0, Math.PI * 2);
        ctx.fill();
      });
    }

    // Animation loop
    let animationId: number;
    
    function animate() {
      updateParticles();
      drawParticles();
      animationId = requestAnimationFrame(animate);
    }

    animate();

    // Clean up
    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-[-1]"
      style={{ opacity: 0.7 }}
    />
  );
} 