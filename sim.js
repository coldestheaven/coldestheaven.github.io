// 模拟经营：经营一家小店，招待顾客、升级店铺、每天结算房租
(function () {
  const canvas = document.getElementById('simCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = 480, H = 400;
  const SLOTS = [80, 190, 300, 410];
  const CUSTOMER_COLORS = ['#60a5fa', '#f472b6', '#fbbf24', '#34d399', '#a78bfa'];

  const overlay = document.getElementById('simOverlay');
  const title = document.getElementById('simOverlayTitle');
  const text = document.getElementById('simOverlayText');
  const btn = document.getElementById('simOverlayBtn');
  const moneyEl = document.getElementById('simMoney');
  const repEl = document.getElementById('simRep');
  const dayEl = document.getElementById('simDay');
  const servedEl = document.getElementById('simServed');
  const upBtns = {
    price: document.getElementById('upPrice'),
    decor: document.getElementById('upDecor'),
    helper: document.getElementById('upHelper')
  };

  let state = 'ready', active = false, last = 0;
  let money, rep, day, served, servedToday, earnedToday, dayTimer, spawnTimer, helperTimer;
  let priceLevel, decorLevel, helperLevel, customers, floats;

  function price() { return 8 + priceLevel * 5 + Math.floor(day / 2) * 2; }
  function cost(kind) {
    return kind === 'price' ? 40 + priceLevel * 35
      : kind === 'decor' ? 60 + decorLevel * 45
      : 120 + helperLevel * 90;
  }
  function updateHud() {
    moneyEl.textContent = money;
    repEl.textContent = rep;
    dayEl.textContent = day;
    servedEl.textContent = served;
    upBtns.price.textContent = '💰 提价 (' + cost('price') + ')';
    upBtns.decor.textContent = '🪴 装修 (' + cost('decor') + ')';
    upBtns.helper.textContent = '🤖 雇助手 (' + cost('helper') + ')';
    Object.keys(upBtns).forEach(k => { upBtns[k].disabled = money < cost(k); });
  }
  function start() {
    money = 60; rep = 5; day = 1; served = 0; servedToday = 0; earnedToday = 0;
    dayTimer = 45; spawnTimer = 800; helperTimer = 5000;
    priceLevel = 0; decorLevel = 0; helperLevel = 0;
    customers = []; floats = [];
    state = 'playing'; overlay.classList.remove('show'); updateHud();
  }
  function end(reason) {
    state = 'over';
    title.textContent = '店铺关门';
    text.textContent = reason + ' · 坚持了 ' + day + ' 天，服务 ' + served + ' 位顾客';
    btn.textContent = '重新开张';
    overlay.classList.add('show');
  }
  function endDay() {
    const rent = 20 + day * 8;
    money -= rent;
    state = 'dayend';
    title.textContent = '第 ' + day + ' 天结束';
    text.textContent = '服务 ' + servedToday + ' 位 · 收入 ' + earnedToday + ' · 房租 -' + rent + ' · 剩余资金 ' + money;
    btn.textContent = money < 0 ? '查看结果' : '继续营业';
    updateHud();
    if (money < 0) { state = 'over'; btn.textContent = '重新开张'; text.textContent = '资金为负，店铺破产！' + text.textContent; }
    overlay.classList.add('show');
  }
  function serve(c) {
    const gain = price() + (c.vip ? 12 : 0);
    money += gain; served++; servedToday++; earnedToday += gain;
    floats.push({ x: SLOTS[c.slot], y: 230, text: '+$' + gain, t: 0 });
    customers = customers.filter(o => o !== c);
    updateHud();
  }
  function spawn() {
    const used = customers.map(c => c.slot);
    const free = SLOTS.map((_, i) => i).filter(i => !used.includes(i));
    if (!free.length) return;
    const slot = free[Math.floor(Math.random() * free.length)];
    const max = Math.max(6, 14 - day * 0.5 + decorLevel * 2);
    customers.push({
      slot, patience: max, max, vip: Math.random() < 0.12,
      color: CUSTOMER_COLORS[Math.floor(Math.random() * CUSTOMER_COLORS.length)]
    });
  }
  function update(dt) {
    if (state !== 'playing' || !active) return;
    dayTimer -= dt / 1000;
    spawnTimer -= dt;
    if (spawnTimer <= 0) {
      spawn();
      spawnTimer = Math.max(900, 2400 - day * 120);
    }
    if (helperLevel > 0) {
      helperTimer -= dt;
      if (helperTimer <= 0) {
        const target = customers.slice().sort((a, b) => a.patience - b.patience)[0];
        if (target) serve(target);
        helperTimer = Math.max(1800, 6000 - helperLevel * 1200);
      }
    }
    customers.forEach(c => {
      c.patience -= dt / 1000;
      if (c.patience <= 0) {
        rep--; updateHud();
        floats.push({ x: SLOTS[c.slot], y: 230, text: '生气离开', t: 0 });
        if (rep <= 0) end('声望耗尽');
      }
    });
    customers = customers.filter(c => c.patience > 0 && rep > 0);
    floats.forEach(f => f.t += dt);
    floats = floats.filter(f => f.t < 1100);
    if (rep > 0 && dayTimer <= 0) {
      if (customers.length) { // 打烊前把还在店的顾客服务完
        customers.forEach(c => { earnedToday += price(); money += price(); served++; servedToday++; });
        customers = []; updateHud();
      }
      endDay();
    }
  }
  function draw() {
    ctx.fillStyle = '#0b1020'; ctx.fillRect(0, 0, W, H);
    // 店铺背景
    ctx.fillStyle = '#162039'; ctx.fillRect(0, 0, W, 96);
    ctx.fillStyle = '#4f8cff'; ctx.fillRect(0, 84, W, 8);
    for (let i = 0; i < 10; i++) {
      ctx.fillStyle = i % 2 ? '#7c5cff' : '#4f8cff';
      ctx.beginPath(); ctx.moveTo(i * 48, 84); ctx.lineTo(i * 48 + 24, 104); ctx.lineTo(i * 48 + 48, 84); ctx.fill();
    }
    ctx.fillStyle = '#e2e8f0'; ctx.font = 'bold 26px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText('小 店', W / 2, 48);
    ctx.font = '12px sans-serif'; ctx.fillStyle = '#94a3b8';
    ctx.fillText('第 ' + day + ' 天 · 单价 $' + price() + (helperLevel ? ' · 助手在岗' : ''), W / 2, 70);
    // 柜台
    ctx.fillStyle = '#3b2a20'; ctx.fillRect(0, 300, W, 100);
    ctx.fillStyle = '#5b4030'; ctx.fillRect(0, 300, W, 12);
    // 顾客
    customers.forEach(c => {
      const x = SLOTS[c.slot], y = 270;
      ctx.fillStyle = c.color;
      ctx.beginPath(); ctx.arc(x, y - 22, 15, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.moveTo(x - 19, y + 22); ctx.lineTo(x - 15, y - 6);
      ctx.lineTo(x + 15, y - 6); ctx.lineTo(x + 19, y + 22); ctx.fill();
      if (c.vip) {
        ctx.fillStyle = '#fde047'; ctx.font = '14px sans-serif'; ctx.fillText('★', x, y - 44);
      }
      const p = Math.max(0, c.patience / c.max);
      ctx.fillStyle = '#0f172a'; ctx.fillRect(x - 24, y - 50, 48, 6);
      ctx.fillStyle = p > 0.5 ? '#4ade80' : p > 0.25 ? '#fbbf24' : '#ef4444';
      ctx.fillRect(x - 24, y - 50, 48 * p, 6);
    });
    ctx.fillStyle = '#94a3b8'; ctx.font = '13px sans-serif';
    ctx.fillText(customers.length ? '点击顾客结账' : '等待顾客上门…', W / 2, 345);
    // 飘字
    floats.forEach(f => {
      ctx.globalAlpha = Math.max(0, 1 - f.t / 1100);
      ctx.fillStyle = f.text.startsWith('+') ? '#4ade80' : '#ef4444';
      ctx.font = 'bold 18px sans-serif';
      ctx.fillText(f.text, f.x, f.y - f.t * 0.04);
      ctx.globalAlpha = 1;
    });
  }
  function loop(ts) {
    const dt = Math.min(50, ts - last || 16); last = ts;
    update(dt); draw(); requestAnimationFrame(loop);
  }

  canvas.addEventListener('pointerdown', e => {
    if (state !== 'playing' || !active) return;
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width * W;
    const y = (e.clientY - rect.top) / rect.height * H;
    if (y < 190 || y > 310) return;
    const target = customers.find(c => Math.abs(SLOTS[c.slot] - x) < 34);
    if (target) serve(target);
  });
  Object.keys(upBtns).forEach(kind => {
    upBtns[kind].addEventListener('click', () => {
      if (state !== 'playing' || money < cost(kind)) return;
      money -= cost(kind);
      if (kind === 'price') priceLevel++;
      else if (kind === 'decor') decorLevel++;
      else helperLevel++;
      updateHud();
    });
  });
  btn.addEventListener('click', () => {
    window.arcadeFs.enter(document.getElementById('simShell'));
    if (state === 'dayend') {
      day++; dayTimer = 45; servedToday = 0; earnedToday = 0;
      state = 'playing'; overlay.classList.remove('show'); updateHud();
    } else start();
  });
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(entries => { active = entries[0].isIntersecting; }, { threshold: 0.1 }).observe(canvas);
  } else active = true;
  money = 60; rep = 5; day = 1; served = 0; priceLevel = 0; decorLevel = 0; helperLevel = 0;
  customers = []; floats = []; updateHud(); requestAnimationFrame(loop);
})();
