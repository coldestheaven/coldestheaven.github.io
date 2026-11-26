// 全站通用脚本：年份、菜单、滚动、背景分形、全屏管理

// 页脚年份
const yearEl = document.getElementById('year');
if (yearEl) yearEl.textContent = new Date().getFullYear();

// 移动端菜单
const menuBtn = document.getElementById('menuBtn');
const navLinks = document.getElementById('navLinks');
if (menuBtn && navLinks) {
  menuBtn.addEventListener('click', () => {
    navLinks.classList.toggle('open');
    menuBtn.setAttribute('aria-expanded', navLinks.classList.contains('open'));
  });
  navLinks.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
    navLinks.classList.remove('open');
    menuBtn.setAttribute('aria-expanded', 'false');
  }));
}

// 导航高亮（按当前页面）
(function () {
  const file = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a').forEach(a => {
    const target = a.getAttribute('href');
    if (target === file || (file === '' && target === 'index.html')) a.classList.add('active');
  });
})();

// 滚动进度 / 回到顶部 / 显现动画
const progress = document.getElementById('progress');
const toTop = document.getElementById('toTop');
window.addEventListener('scroll', () => {
  const max = document.documentElement.scrollHeight - window.innerHeight;
  if (progress) progress.style.width = (max > 0 ? (window.scrollY / max) * 100 : 0) + '%';
  if (toTop) toTop.classList.toggle('show', window.scrollY > 500);
}, { passive: true });
if (toTop) toTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

if ('IntersectionObserver' in window) {
  const revealObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) { entry.target.classList.add('visible'); revealObserver.unobserve(entry.target); }
    });
  }, { threshold: 0.01 });
  document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));
} else {
  document.querySelectorAll('.reveal').forEach(el => el.classList.add('visible'));
}


// 通用全屏：CSS 铺满（iOS 也支持），支持的浏览器再叠加原生 Fullscreen API
window.arcadeFs = {
  active: null,
  enter(shell) {
    if (!shell) return;
    if (this.active && this.active !== shell) this.leave();
    this.active = shell;
    shell.classList.add('fs');
    document.body.classList.add('game-full');
    const canvas = shell.querySelector('canvas');
    if (canvas && canvas.focus) canvas.focus();
    if (shell.requestFullscreen && !document.fullscreenElement) {
      const p = shell.requestFullscreen();
      if (p && p.catch) p.catch(() => {});
    }
  },
  leave() {
    const shell = this.active;
    if (!shell) return;
    this.active = null;
    shell.classList.remove('fs');
    document.body.classList.remove('game-full');
    if (document.fullscreenElement && document.exitFullscreen) {
      const p = document.exitFullscreen();
      if (p && p.catch) p.catch(() => {});
    }
  }
};
document.querySelectorAll('.game-shell').forEach(shell => {
  const fsBtn = shell.querySelector('.game-fs-btn');
  const quitBtn = shell.querySelector('.game-quit');
  const backBtn = shell.querySelector('.game-back');
  if (fsBtn) fsBtn.addEventListener('click', () => window.arcadeFs.enter(shell));
  if (quitBtn) quitBtn.addEventListener('click', () => window.arcadeFs.leave());
  if (backBtn) backBtn.addEventListener('click', () => window.arcadeFs.leave());
});
document.addEventListener('fullscreenchange', () => {
  if (!document.fullscreenElement && window.arcadeFs.active) window.arcadeFs.leave();
});
window.addEventListener('keydown', e => {
  if (e.key === 'Escape' && window.arcadeFs.active && !document.fullscreenElement) window.arcadeFs.leave();
});
