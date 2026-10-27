/**
 * CONFETTI ENGINE - HIỆU ỨNG PHÁO GIẤY CHÚC MỪNG HOÀN HẢO
 * Thuần HTML5 Canvas, mượt mà 60fps, tự động dọn dẹp tài nguyên
 */

const ConfettiEngine = (() => {
  let canvas = null;
  let ctx = null;
  let particles = [];
  let animationId = null;
  let isRunning = false;

  const COLORS = [
    '#f43f5e', '#ec4899', '#d946ef', '#a855f7', 
    '#6366f1', '#3b82f6', '#06b6d4', '#10b981', 
    '#84cc16', '#eab308', '#f97316'
  ];

  function init() {
    if (!canvas) {
      canvas = document.getElementById('confetti-canvas');
      if (!canvas) {
        canvas = document.createElement('canvas');
        canvas.id = 'confetti-canvas';
        document.body.appendChild(canvas);
      }
      ctx = canvas.getContext('2d');
      resize();
      window.addEventListener('resize', resize);
    }
  }

  function resize() {
    if (canvas) {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }
  }

  function createParticle() {
    return {
      x: Math.random() * canvas.width,
      y: -20 - Math.random() * 50,
      size: 8 + Math.random() * 8,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      speedY: 2.5 + Math.random() * 4,
      speedX: (Math.random() - 0.5) * 3,
      rotation: Math.random() * 360,
      rotationSpeed: (Math.random() - 0.5) * 8,
      wobble: Math.random() * Math.PI,
      wobbleSpeed: 0.05 + Math.random() * 0.05
    };
  }

  function update() {
    if (!isRunning) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      p.y += p.speedY;
      p.x += Math.sin(p.wobble) * 2 + p.speedX;
      p.wobble += p.wobbleSpeed;
      p.rotation += p.rotationSpeed;

      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate((p.rotation * Math.PI) / 180);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
      ctx.restore();

      // Nếu rơi quá màn hình thì xóa hoặc tạo lại trong thời gian nổ
      if (p.y > canvas.height + 20) {
        if (particles.length < 150 && isRunning) {
          particles[i] = createParticle();
        } else {
          particles.splice(i, 1);
          i--;
        }
      }
    }

    if (particles.length > 0) {
      animationId = requestAnimationFrame(update);
    } else {
      stop();
    }
  }

  function shoot(durationMs = 4000) {
    init();
    stop();
    isRunning = true;
    particles = [];

    // Tạo đợt pháo đầu tiên
    for (let i = 0; i < 120; i++) {
      const p = createParticle();
      p.y = Math.random() * (canvas.height * 0.4); // rơi từ nửa trên
      particles.push(p);
    }

    update();

    // Dừng sinh thêm sau khoảng duration
    setTimeout(() => {
      isRunning = false;
    }, durationMs);
  }

  function stop() {
    isRunning = false;
    if (animationId) {
      cancelAnimationFrame(animationId);
      animationId = null;
    }
    if (ctx && canvas) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    particles = [];
  }

  return {
    shoot,
    stop,
    init
  };
})();

