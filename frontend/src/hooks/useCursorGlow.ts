import { useEffect } from 'react';

/**
 * useCursorGlow
 * Dynamically tracks cursor proximity to cards and interactive blocks,
 * computing distance and setting CSS custom properties (--mouse-x, --mouse-y, --proximity)
 * to deliver a high-tech glowing spotlight & illuminated border effect.
 *
 * @param proximityRadius Max distance (px) from card edge to trigger proximity glow. Default 200px.
 */
export const useCursorGlow = (proximityRadius = 200) => {
  useEffect(() => {
    let animationFrameId: number = 0;
    let lastX = -1000;
    let lastY = -1000;

    const updateGlow = () => {
      animationFrameId = 0;
      const elements = document.querySelectorAll<HTMLElement>(
        '.cyber-card, .glass-card, .glow-card, .investigation-panel, [data-glow]'
      );

      elements.forEach((el) => {
        const rect = el.getBoundingClientRect();

        // Skip off-screen elements
        if (
          rect.bottom < -60 ||
          rect.top > window.innerHeight + 60 ||
          rect.right < -60 ||
          rect.left > window.innerWidth + 60
        ) {
          if (el.style.getPropertyValue('--proximity') && el.style.getPropertyValue('--proximity') !== '0') {
            el.style.setProperty('--proximity', '0');
          }
          return;
        }

        const x = lastX - rect.left;
        const y = lastY - rect.top;

        // Calculate Euclidean distance from cursor to closest point on element bounding box
        const dx = Math.max(rect.left - lastX, 0, lastX - rect.right);
        const dy = Math.max(rect.top - lastY, 0, lastY - rect.bottom);
        const distance = Math.hypot(dx, dy);

        if (distance < proximityRadius) {
          // Normalize proximity: 0 at radius limit -> 1 when touching/inside card
          const rawProximity = 1 - distance / proximityRadius;
          // Smooth non-linear curve for organic cyber glow
          const proximity = Math.pow(Math.max(0, Math.min(1, rawProximity)), 1.35);

          el.style.setProperty('--mouse-x', `${Math.round(x)}px`);
          el.style.setProperty('--mouse-y', `${Math.round(y)}px`);
          el.style.setProperty('--proximity', proximity.toFixed(3));
        } else {
          if (el.style.getPropertyValue('--proximity') && el.style.getPropertyValue('--proximity') !== '0') {
            el.style.setProperty('--proximity', '0');
          }
        }
      });
    };

    const handlePointerMove = (e: PointerEvent) => {
      lastX = e.clientX;
      lastY = e.clientY;

      if (!animationFrameId) {
        animationFrameId = requestAnimationFrame(updateGlow);
      }
    };

    const handlePointerLeave = () => {
      const elements = document.querySelectorAll<HTMLElement>(
        '.cyber-card, .glass-card, .glow-card, .investigation-panel, [data-glow]'
      );
      elements.forEach((el) => {
        el.style.setProperty('--proximity', '0');
      });
    };

    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    document.addEventListener('mouseleave', handlePointerLeave, { passive: true });

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      document.removeEventListener('mouseleave', handlePointerLeave);
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [proximityRadius]);
};
