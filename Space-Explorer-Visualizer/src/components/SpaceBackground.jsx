import React, { useEffect, useRef } from 'react';
import { useTheme } from '../context/ThemeContext';

const SpaceBackground = () => {
    const canvasRef = useRef(null);
    const { theme } = useTheme();

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let animationFrameId;
        let width = (canvas.width = window.innerWidth);
        let height = (canvas.height = window.innerHeight);

        const handleResize = () => {
            if (!canvas) return;
            width = canvas.width = window.innerWidth;
            height = canvas.height = window.innerHeight;
            initParticles();
        };

        window.addEventListener('resize', handleResize);

        // Star & Nebula particles
        const numStars = 120;
        let stars = [];

        // Shooting stars (meteors)
        let meteors = [];

        function initParticles() {
            stars = [];
            for (let i = 0; i < numStars; i++) {
                stars.push({
                    x: Math.random() * width,
                    y: Math.random() * height,
                    radius: Math.random() * 1.8 + 0.4,
                    alpha: Math.random() * 0.8 + 0.2,
                    speed: Math.random() * 0.4 + 0.1,
                    twinkleSpeed: Math.random() * 0.02 + 0.005,
                    color: Math.random() > 0.4 ? '#66FCF1' : (Math.random() > 0.5 ? '#FFE800' : '#FFFFFF'),
                });
            }
        }

        initParticles();

        function spawnMeteor() {
            if (meteors.length < 2 && Math.random() < 0.015) {
                meteors.push({
                    x: Math.random() * width,
                    y: Math.random() * (height * 0.4),
                    length: Math.random() * 90 + 50,
                    speed: Math.random() * 8 + 6,
                    angle: Math.PI / 4 + (Math.random() - 0.5) * 0.2,
                    opacity: 1,
                    color: Math.random() > 0.5 ? '#66FCF1' : '#FF007F'
                });
            }
        }

        let step = 0;

        const render = () => {
            step++;
            ctx.clearRect(0, 0, width, height);

            const isNight = theme === 'night';

            // Subtle pulsing cosmic aurora glow
            if (isNight) {
                const grad1 = ctx.createRadialGradient(
                    width * 0.25 + Math.sin(step * 0.008) * 60,
                    height * 0.35 + Math.cos(step * 0.006) * 50,
                    10,
                    width * 0.25,
                    height * 0.35,
                    Math.max(width, height) * 0.55
                );
                grad1.addColorStop(0, 'rgba(102, 252, 241, 0.045)');
                grad1.addColorStop(0.5, 'rgba(69, 162, 158, 0.025)');
                grad1.addColorStop(1, 'rgba(0, 0, 0, 0)');
                ctx.fillStyle = grad1;
                ctx.fillRect(0, 0, width, height);

                const grad2 = ctx.createRadialGradient(
                    width * 0.8 - Math.cos(step * 0.007) * 70,
                    height * 0.7 - Math.sin(step * 0.009) * 60,
                    20,
                    width * 0.8,
                    height * 0.7,
                    Math.max(width, height) * 0.5
                );
                grad2.addColorStop(0, 'rgba(255, 0, 127, 0.04)');
                grad2.addColorStop(1, 'rgba(0, 0, 0, 0)');
                ctx.fillStyle = grad2;
                ctx.fillRect(0, 0, width, height);
            }

            // Draw Stars with gentle floating drift and twinkling
            for (let i = 0; i < stars.length; i++) {
                const s = stars[i];
                s.y -= s.speed;
                if (s.y < 0) {
                    s.y = height;
                    s.x = Math.random() * width;
                }
                s.alpha += Math.sin(step * s.twinkleSpeed) * 0.01;
                const currentAlpha = Math.max(0.15, Math.min(1, s.alpha));

                ctx.save();
                ctx.globalAlpha = isNight ? currentAlpha : currentAlpha * 0.35;
                ctx.fillStyle = isNight ? s.color : '#0077B6';
                ctx.shadowBlur = isNight ? s.radius * 4 : 0;
                ctx.shadowColor = s.color;
                ctx.beginPath();
                ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            }

            // Draw shooting meteors
            if (isNight) {
                spawnMeteor();
                for (let i = meteors.length - 1; i >= 0; i--) {
                    const m = meteors[i];
                    m.x += Math.cos(m.angle) * m.speed;
                    m.y += Math.sin(m.angle) * m.speed;
                    m.opacity -= 0.014;

                    if (m.opacity <= 0 || m.x > width || m.y > height) {
                        meteors.splice(i, 1);
                        continue;
                    }

                    ctx.save();
                    ctx.globalAlpha = m.opacity;
                    ctx.strokeStyle = m.color;
                    ctx.lineWidth = 1.8;
                    ctx.shadowBlur = 8;
                    ctx.shadowColor = m.color;

                    ctx.beginPath();
                    ctx.moveTo(m.x, m.y);
                    ctx.lineTo(
                        m.x - Math.cos(m.angle) * m.length,
                        m.y - Math.sin(m.angle) * m.length
                    );
                    ctx.stroke();
                    ctx.restore();
                }
            }

            animationFrameId = requestAnimationFrame(render);
        };

        render();

        return () => {
            window.removeEventListener('resize', handleResize);
            cancelAnimationFrame(animationFrameId);
        };
    }, [theme]);

    return (
        <canvas
            ref={canvasRef}
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100vw',
                height: '100vh',
                pointerEvents: 'none',
                zIndex: 0,
            }}
            aria-hidden="true"
        />
    );
};

export default SpaceBackground;
