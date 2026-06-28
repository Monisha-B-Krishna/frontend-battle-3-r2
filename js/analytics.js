/* ============================================================
   OVERMIND — analytics.js v2
   Pure vanilla canvas — fit screen, bold text, sharp numbers
   ============================================================ */

const Analytics = (() => {

  let _visible = false;
  let _timer   = null;
  let _overlay = null;
  let _btn     = null;

  const C = {
    phosphor:'#39FF14', phosphorDim:'#4ADE80',
    electric:'#00E5FF', electricDim:'#22D3EE',
    gold:'#FFD700',     goldDim:'#FCD34D',
    purple:'#C084FC',   teal:'#2DD4BF',
    alert:'#FF4444',    bg:'#0C110A',
    bgDark:'#080E06',   border:'#1A2614',
    text:'#D9F99D',     textMuted:'#86EFAC',
    textDim:'#6DAA6D',
  };

  const STATUS_COLORS = {
    active:'#2DD4BF', completed:'#4ADE80',
    failed:'#FF4444', planned:'#C084FC',
  };

  function _statusCounts(rows) {
    const m={};
    rows.forEach(r=>{ const s=(r.project_status||'unknown').toLowerCase(); m[s]=(m[s]||0)+1; });
    return m;
  }

  function _topBy(rows, gF, vF, n=7) {
    const m={};
    rows.forEach(r=>{ const k=(r[gF]||'Unknown').slice(0,24); m[k]=(m[k]||0)+(parseFloat(r[vF])||0); });
    return Object.entries(m).sort((a,b)=>b[1]-a[1]).slice(0,n);
  }

  function _avgRoi(rows) {
    const s={},c={};
    rows.forEach(r=>{ const k=(r.project_status||'unknown').toLowerCase(); s[k]=(s[k]||0)+(parseFloat(r.roi_percent)||0); c[k]=(c[k]||0)+1; });
    return Object.keys(s).map(k=>({k,v:s[k]/c[k]}));
  }

  function _prep(canvas) {
    const dpr = window.devicePixelRatio || 1;
    const W = canvas.parentElement.clientWidth  - 16;
    const H = canvas.parentElement.clientHeight - 16;
    canvas.width  = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width  = W + 'px';
    canvas.style.height = H + 'px';
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);
    ctx.fillStyle = C.bg;
    ctx.fillRect(0, 0, W, H);
    return { ctx, W, H };
  }

  function _title(ctx, text, W) {
    ctx.font = 'bold 13px "Share Tech Mono", monospace';
    ctx.fillStyle = C.textMuted;
    ctx.textAlign = 'left';
    ctx.fillText(text, 12, 20);
    ctx.strokeStyle = C.border;
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(12,28); ctx.lineTo(W-12,28); ctx.stroke();
  }

  function _txt(ctx, t, x, y, color, size, align='left', bold=false) {
    ctx.font = `${bold?'bold ':''}${size}px "Share Tech Mono", monospace`;
    ctx.fillStyle = color;
    ctx.textAlign = align;
    ctx.fillText(t, x, y);
  }

  // ── Chart 1: Doughnut ────────────────────────────────────

  function _doughnut(id, data) {
    const canvas = document.getElementById(id);
    if (!canvas) return;
    const {ctx,W,H} = _prep(canvas);
    _title(ctx, '▸ FIELD STATUS DISTRIBUTION', W);

    const entries = Object.entries(data);
    const total   = entries.reduce((s,[,v])=>s+v,0);
    if (!total) return;

    const cx = W*0.38, cy = H*0.54;
    const R  = Math.min(W*0.3, H*0.38);
    const r  = R*0.52;

    let angle = -Math.PI/2;
    entries.forEach(([s,count]) => {
      const sweep = (count/total)*2*Math.PI;
      const color = STATUS_COLORS[s] || C.textDim;
      ctx.beginPath(); ctx.moveTo(cx,cy);
      ctx.arc(cx,cy,R,angle,angle+sweep); ctx.closePath();
      ctx.fillStyle = color; ctx.globalAlpha=0.88; ctx.fill();
      ctx.globalAlpha=1; ctx.strokeStyle=C.bgDark; ctx.lineWidth=2; ctx.stroke();
      angle += sweep;
    });

    // Hole
    ctx.beginPath(); ctx.arc(cx,cy,r,0,2*Math.PI);
    ctx.fillStyle=C.bg; ctx.fill();

    // Center
    _txt(ctx, total.toLocaleString(), cx, cy+6,  C.phosphor, 18, 'center', true);
    _txt(ctx, 'TOTAL',                cx, cy+22, C.textDim,  11, 'center');

    // Legend — bigger, bolder
    const lx = W*0.66;
    let ly = H*0.22;
    entries.forEach(([s,count]) => {
      const color = STATUS_COLORS[s] || C.textDim;
      const pct   = Math.round(count/total*100);
      ctx.fillStyle = color;
      ctx.fillRect(lx, ly, 14, 14);
      _txt(ctx, s.toUpperCase(),               lx+20, ly+12, C.text,    12, 'left', true);
      _txt(ctx, count.toLocaleString()+' ('+pct+'%)', lx+20, ly+26, C.textMuted, 11);
      ly += 44;
    });
  }

  // ── Chart 2 & 3: Horizontal Bar ──────────────────────────

  function _hbar(id, entries, title, color, fmtFn) {
    const canvas = document.getElementById(id);
    if (!canvas) return;
    const {ctx,W,H} = _prep(canvas);
    _title(ctx, title, W);

    if (!entries.length) return;
    const padL=155, padR=70, padT=36, padB=10;
    const chartW=W-padL-padR;
    const rowH=(H-padT-padB)/entries.length;
    const maxVal=entries[0][1]||1;

    entries.forEach(([label,val],i) => {
      const y    = padT + i*rowH;
      const barH = rowH*0.5;
      const barW = (val/maxVal)*chartW;
      const barY = y + (rowH-barH)/2;

      // Track
      ctx.fillStyle='rgba(26,38,20,0.5)';
      ctx.fillRect(padL, barY, chartW, barH);

      // Bar
      const grad = ctx.createLinearGradient(padL,0,padL+barW,0);
      grad.addColorStop(0, color);
      grad.addColorStop(1, color+'44');
      ctx.fillStyle=grad;
      ctx.fillRect(padL, barY, barW, barH);

      // Label — bold, bigger
      const short = label.length>22 ? label.slice(0,21)+'…' : label;
      _txt(ctx, short, padL-8, barY+barH*0.72, C.text, 11, 'right', true);

      // Value — sharp
      _txt(ctx, fmtFn(val), padL+barW+6, barY+barH*0.72, C.textMuted, 11, 'left');
    });
  }

  // ── Chart 4: Vertical Bar ────────────────────────────────

  function _vbar(id, data) {
    const canvas = document.getElementById(id);
    if (!canvas) return;
    const {ctx,W,H} = _prep(canvas);
    _title(ctx, '▸ AVG ROI % BY FIELD STATUS', W);

    if (!data.length) return;
    const padL=55, padR=16, padT=36, padB=32;
    const chartW=W-padL-padR, chartH=H-padT-padB;
    const maxVal=Math.max(...data.map(d=>Math.abs(d.v)),1);
    const barW=(chartW/data.length)*0.55;
    const gap=chartW/data.length;

    // Y axis
    ctx.strokeStyle=C.border; ctx.lineWidth=1;
    ctx.beginPath(); ctx.moveTo(padL,padT); ctx.lineTo(padL,padT+chartH); ctx.stroke();

    // Grid + Y labels
    [0.25,0.5,0.75,1].forEach(p => {
      const y = padT+chartH-p*chartH;
      ctx.strokeStyle=C.border; ctx.lineWidth=0.5;
      ctx.setLineDash([3,3]);
      ctx.beginPath(); ctx.moveTo(padL,y); ctx.lineTo(W-padR,y); ctx.stroke();
      ctx.setLineDash([]);
      _txt(ctx, Math.round(maxVal*p)+'%', padL-6, y+4, C.textDim, 10, 'right');
    });

    data.forEach(({k,v},i) => {
      const x     = padL+i*gap+(gap-barW)/2;
      const bH    = (Math.abs(v)/maxVal)*chartH;
      const y     = padT+chartH-bH;
      const color = v>=150?C.phosphor : v>=100?C.teal : v>=0?C.gold : C.alert;

      const grad = ctx.createLinearGradient(0,y,0,y+bH);
      grad.addColorStop(0,color); grad.addColorStop(1,color+'33');
      ctx.fillStyle=grad;
      ctx.fillRect(x,y,barW,bH);

      // Value above bar — bold
      _txt(ctx, v.toFixed(1)+'%', x+barW/2, y-6, color, 11, 'center', true);
      // X label — bold
      _txt(ctx, k.slice(0,9).toUpperCase(), x+barW/2, padT+chartH+18, C.text, 11, 'center', true);
    });
  }

  // ── Render ───────────────────────────────────────────────

  function _render() {
    if (!_visible) return;
    const rows = State.getViewPool();
    if (!rows.length) return;

    const el = document.getElementById('analytics-row-count');
    if (el) el.textContent = rows.length.toLocaleString() + ' rows analysed';

    _doughnut('chart-status',    _statusCounts(rows));
    _hbar('chart-industry',      _topBy(rows,'industry','annual_savings_usd'),    '▸ TOP INDUSTRIES // SAVINGS USD',    C.electricDim, v=>v>=1e6?'$'+(v/1e6).toFixed(1)+'M':'$'+(v/1e3).toFixed(0)+'K');
    _hbar('chart-automation',    _topBy(rows,'automation_type','robots_deployed'), '▸ AUTOMATION TYPES // ROBOTS',       C.goldDim,     v=>Math.round(v).toLocaleString());
    _vbar('chart-roi',           _avgRoi(rows));
  }

  function show() {
    if (_visible) return;
    _visible=true;
    if (_overlay) _overlay.style.display='flex';
    if (_btn) { _btn.textContent='✕ CLOSE ANALYTICS'; _btn.style.borderColor='var(--electric)'; }
    setTimeout(_render,60);
    _timer=setInterval(_render,2000);
  }

  function hide() {
    if (!_visible) return;
    _visible=false;
    if (_overlay) _overlay.style.display='none';
    if (_btn) { _btn.textContent='◈ ANALYTICS VIEW'; _btn.style.borderColor='var(--electric-muted)'; }
    clearInterval(_timer);
  }

  function toggle() { _visible?hide():show(); }

  function init() {
    _overlay=document.getElementById('analytics-overlay');
    _btn=document.getElementById('btn-analytics');
    if (_btn)    _btn.addEventListener('click',toggle);
    const close=document.getElementById('btn-analytics-close');
    if (close)   close.addEventListener('click',hide);
    window.addEventListener('resize',()=>{ if(_visible) setTimeout(_render,50); });
  }

  return { init, show, hide, toggle };
})();