// 全站通用脚本：年份、菜单、滚动、游戏筛选/切换、全屏管理

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

// 游戏目录：首页筛选与游戏页「上一款 / 下一款」共用
const GAMES = [
  { file: 'bomber.html', name: '炸弹人', icon: '💣', category: 'action',
    tip: 'WASD / 方向键移动，空格放炸弹。炸弹会连锁引爆，炸开砖块有机会获得火力、炸弹数与加速道具；消灭全部敌人即可过关。手机用屏幕方向键和 💣 按钮。' },
  { file: 'tank.html', name: '坦克大战', icon: '🛠️', category: 'action',
    tip: '方向键 / WASD 驾驶坦克，空格开炮。砖墙可以打穿，钢墙打不穿；守住底部基地，消灭这一关的全部敌军。手机用屏幕方向键和开火按钮。' },
  { file: 'sim.html', name: '模拟经营', icon: '🏪', category: 'biz',
    tip: '点击有耐心的顾客结账赚钱。提价提高单次收入但会加快顾客流失，装修延长耐心，雇助手可以自动服务。每天结束结算房租，别让资金变成负数。' },
  { file: 'tetris.html', name: '俄罗斯方块', icon: '🧱', category: 'puzzle',
    tip: '← → 移动，↑ 旋转，↓ 加速，空格直接落下，P 暂停。把方块拼成完整横行即可消除，一次消得越多得分越高；等级随消除行数提升，下落也会更快。' },
  { file: 'g2048.html', name: '2048', icon: '🔢', category: 'puzzle',
    tip: '方向键 / WASD 或手指滑动，让相同数字碰撞合并。每一步都会出现一个新方块，凑出 2048 即达成目标；最高分保存在本机浏览器中。' },
  { file: 'memory.html', name: '记忆翻牌', icon: '🧠', category: 'puzzle',
    tip: '每次翻开两张卡片，图案相同就会配对成功。记住已翻开图案的位置，用尽量少的步数和更短的时间配完 8 对；最佳用时保存在本机。' }
];
const LAST_GAME_KEY = 'gdbLastGame';

// 首页：类型筛选 + 最近游玩
(function () {
  const filters = document.querySelector('.game-filters');
  const cards = Array.from(document.querySelectorAll('.game-card'));
  if (!filters || !cards.length) return;

  const countEl = document.getElementById('gameCount');
  filters.addEventListener('click', e => {
    const btn = e.target.closest('button[data-filter]');
    if (!btn) return;
    const filter = btn.dataset.filter;
    filters.querySelectorAll('button[data-filter]').forEach(b => {
      const on = b === btn;
      b.classList.toggle('active', on);
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
    let shown = 0;
    cards.forEach(card => {
      const ok = filter === 'all' || card.dataset.category === filter;
      card.hidden = !ok;
      if (ok) shown++;
    });
    if (countEl) countEl.textContent = shown;
  });

  let lastFile = null;
  try { lastFile = localStorage.getItem(LAST_GAME_KEY); } catch (e) {}
  const lastGame = GAMES.find(g => g.file === lastFile);
  const resume = document.getElementById('resumeLink');
  if (lastGame) {
    if (resume) {
      resume.href = lastGame.file;
      resume.textContent = `继续上次：${lastGame.icon} ${lastGame.name} →`;
      resume.hidden = false;
    }
    const recentCard = cards.find(c => c.getAttribute('href') === lastGame.file);
    if (recentCard) {
      recentCard.classList.add('recent');
      const badge = document.createElement('span');
      badge.className = 'recent-badge';
      badge.textContent = '最近游玩';
      recentCard.appendChild(badge);
    }
  }
  cards.forEach(card => card.addEventListener('click', () => {
    try { localStorage.setItem(LAST_GAME_KEY, card.getAttribute('href')); } catch (e) {}
  }));
})();

// 游戏页：面包屑 + 玩法说明 + 上一款/下一款
(function () {
  const shell = document.querySelector('.game-shell');
  if (!shell) return;
  const file = location.pathname.split('/').pop();
  const index = GAMES.findIndex(g => g.file === file);
  if (index < 0) return;
  const game = GAMES[index];
  try { localStorage.setItem(LAST_GAME_KEY, game.file); } catch (e) {}

  const wrap = shell.closest('.wrap');
  const head = wrap && wrap.querySelector('.section-head');
  if (head && !wrap.querySelector('.crumb')) {
    const crumb = document.createElement('a');
    crumb.className = 'crumb';
    crumb.href = 'index.html';
    crumb.textContent = '← 全部游戏';
    wrap.insertBefore(crumb, head);
  }

  const prev = GAMES[(index - 1 + GAMES.length) % GAMES.length];
  const next = GAMES[(index + 1) % GAMES.length];
  const extras = document.createElement('div');
  extras.className = 'game-extras';
  const tips = document.createElement('details');
  tips.className = 'game-tips';
  tips.innerHTML = '<summary>📖 玩法与操作</summary><p>' + game.tip + '</p>';
  const nav = document.createElement('nav');
  nav.className = 'game-switcher';
  nav.setAttribute('aria-label', '切换游戏');
  nav.innerHTML =
    '<a class="switch-prev" href="' + prev.file + '">← ' + prev.icon + ' ' + prev.name + '</a>' +
    '<a class="switch-all" href="index.html">全部游戏</a>' +
    '<a class="switch-next" href="' + next.file + '">' + next.icon + ' ' + next.name + ' →</a>';
  extras.appendChild(tips);
  extras.appendChild(nav);
  shell.insertAdjacentElement('afterend', extras);
})();


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
