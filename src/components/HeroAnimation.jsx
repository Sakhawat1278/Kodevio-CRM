import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';

export default function HeroAnimation() {
  const containerRef = useRef(null);
  const counterRef1 = useRef(null);
  const counterRef2 = useRef(null);
  const counterRef3 = useRef(null);

  useEffect(() => {
    // GSAP Animated Counters
    const ctx = gsap.context(() => {
      gsap.fromTo(
        counterRef1.current,
        { textContent: 0 },
        {
          textContent: 185.4,
          duration: 2,
          ease: 'power2.out',
          snap: { textContent: 0.1 },
          onUpdate: function () {
            if (counterRef1.current) {
              counterRef1.current.innerHTML = `$${parseFloat(this.targets()[0].textContent).toFixed(1)}k`;
            }
          },
        }
      );

      gsap.fromTo(
        counterRef2.current,
        { textContent: 0 },
        {
          textContent: 14250,
          duration: 2.2,
          ease: 'power2.out',
          snap: { textContent: 1 },
          onUpdate: function () {
            if (counterRef2.current) {
              counterRef2.current.innerHTML = parseInt(this.targets()[0].textContent).toLocaleString();
            }
          },
        }
      );

      gsap.fromTo(
        counterRef3.current,
        { textContent: 0 },
        {
          textContent: 4.98,
          duration: 1.8,
          ease: 'power2.out',
          snap: { textContent: 0.01 },
          onUpdate: function () {
            if (counterRef3.current) {
              counterRef3.current.innerHTML = `${parseFloat(this.targets()[0].textContent).toFixed(2)} ★`;
            }
          },
        }
      );
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={containerRef} className="hero-stats-grid">
      <div className="stat-card">
        <div className="stat-value" ref={counterRef1}>$0k</div>
        <div className="stat-label">Monthly Revenue Managed</div>
      </div>

      <div className="stat-card">
        <div className="stat-value" ref={counterRef2}>0</div>
        <div className="stat-label">Orders Auto-Dispatched</div>
      </div>

      <div className="stat-card">
        <div className="stat-value" ref={counterRef3}>0 ★</div>
        <div className="stat-label">Average Seller Rating</div>
      </div>
    </div>
  );
}
