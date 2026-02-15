/* Slothcard — client-side postcard generator
   Everything is encoded in the URL hash as compact JSON.
*/

const $ = (id) => document.getElementById(id);
const statusEl = $("status");

const PALETTES = [
  { id: "moss", name: "Moss", bg: "#1f2a24", ink: "#e7efe8", accent: "#9ee2b3", accent2: "#ffd18f" },
  { id: "midnight", name: "Midnight", bg: "#0d1b2a", ink: "#e8f1ff", accent: "#7cc7ff", accent2: "#ffd18f" },
  { id: "terracotta", name: "Terracotta", bg: "#2a1713", ink: "#fff1e8", accent: "#ffb38f", accent2: "#9ee2b3" },
  { id: "seafoam", name: "Seafoam", bg: "#0f2a27", ink: "#e9fffb", accent: "#7af0d6", accent2: "#ffd18f" },
  { id: "paper", name: "Paper", bg: "#f6f0e6", ink: "#1c1c1c", accent: "#2f7d55", accent2: "#c06a2b" },
];

const POSES = [
  { id: "hang", name: "Hanging" },
  { id: "nap", name: "Nap" },
  { id: "tea", name: "Tea" },
  { id: "wave", name: "Wave" },
  { id: "leaf", name: "Leaf" },
];

const DEFAULTS = {
  pal: "moss",
  pose: "hang",
  msg: "Take it slow. You’re doing fine.",
  sig: "— a sloth",
  seed: 1,
};

function clamp(n, a, b){ return Math.max(a, Math.min(b, n)); }

function xorshift32(seed){
  let x = seed | 0;
  return function(){
    x ^= x << 13; x ^= x >>> 17; x ^= x << 5;
    // 0..1
    return ((x >>> 0) / 4294967296);
  }
}

function pick(arr, rnd){ return arr[Math.floor(rnd() * arr.length)] }

function setStatus(msg){
  statusEl.textContent = msg || "";
  if(!msg) return;
  clearTimeout(setStatus._t);
  setStatus._t = setTimeout(()=> statusEl.textContent = "", 2200);
}

function encodeState(state){
  // compact JSON -> base64url
  const json = JSON.stringify(state);
  const b64 = btoa(unescape(encodeURIComponent(json)))
    .replaceAll("+","-").replaceAll("/","_").replaceAll("=","~");
  return b64;
}

function decodeState(str){
  const b64 = str.replaceAll("-","+").replaceAll("_","/").replaceAll("~","=");
  const json = decodeURIComponent(escape(atob(b64)));
  const obj = JSON.parse(json);
  return obj;
}

function readHash(){
  const h = (location.hash || "").replace(/^#/, "").trim();
  if(!h) return null;
  try{ return decodeState(h); }
  catch{ return null; }
}

function writeHash(state){
  const h = encodeState(state);
  // avoid scrolling
  history.replaceState(null, "", "#" + h);
}

function currentStateFromUI(){
  return {
    pal: $("pal").value,
    pose: $("pose").value,
    msg: $("msg").value,
    sig: $("sig").value,
    seed: clamp(parseInt($("seed")?.value || state.seed || 1, 10) || 1, 1, 1_000_000_000)
  };
}

function safeText(s){
  return (s || "").toString().slice(0, 120);
}

function wrapText(text, maxChars){
  // simple word-wrap based on char count; good enough for postcards
  const words = safeText(text).split(/\s+/).filter(Boolean);
  const lines = [];
  let line = "";
  for(const w of words){
    const candidate = line ? (line + " " + w) : w;
    if(candidate.length <= maxChars){
      line = candidate;
    }else{
      if(line) lines.push(line);
      line = w;
    }
  }
  if(line) lines.push(line);
  return lines.slice(0, 3);
}

function slothSVG({ pal, pose, msg, sig, seed }){
  const P = PALETTES.find(p => p.id === pal) || PALETTES[0];
  const rnd = xorshift32(seed | 0);

  const bgPattern = (() => {
    const dots = [];
    for(let i=0;i<40;i++){
      const x = Math.floor(rnd()*1000);
      const y = Math.floor(rnd()*600);
      const r = 1 + Math.floor(rnd()*3);
      const a = 0.06 + rnd()*0.10;
      dots.push(`<circle cx="${x}" cy="${y}" r="${r}" fill="${P.ink}" opacity="${a.toFixed(3)}"/>`);
    }
    return dots.join("");
  })();

  const poseArt = (pose) => {
    const body = `
      <g transform="translate(0,0)">
        <ellipse cx="0" cy="18" rx="72" ry="62" fill="rgba(255,255,255,0.10)"/>
        <ellipse cx="0" cy="0" rx="66" ry="56" fill="rgba(255,255,255,0.06)"/>
        <ellipse cx="0" cy="-10" rx="56" ry="50" fill="rgba(255,255,255,0.07)"/>
        <ellipse cx="0" cy="-30" rx="46" ry="40" fill="rgba(255,255,255,0.09)"/>
        <circle cx="0" cy="-40" r="38" fill="rgba(255,255,255,0.10)"/>
        <ellipse cx="-14" cy="-44" rx="10" ry="16" fill="rgba(0,0,0,0.10)"/>
        <ellipse cx="14" cy="-44" rx="10" ry="16" fill="rgba(0,0,0,0.10)"/>
        <circle cx="-14" cy="-44" r="3.2" fill="rgba(0,0,0,0.35)"/>
        <circle cx="14" cy="-44" r="3.2" fill="rgba(0,0,0,0.35)"/>
        <path d="M -6 -30 Q 0 -24 6 -30" fill="none" stroke="rgba(0,0,0,0.28)" stroke-width="3" stroke-linecap="round"/>
      </g>
    `;

    if(pose === "hang"){
      return `
        <g transform="translate(220,165)">
          <path d="M -140 -110 C -20 -160 120 -150 210 -70" fill="none" stroke="${P.accent}" stroke-width="10" stroke-linecap="round" opacity="0.75"/>
          <path d="M -140 -110 C -20 -165 120 -155 210 -75" fill="none" stroke="${P.accent2}" stroke-width="4" stroke-linecap="round" opacity="0.55"/>
          <g transform="translate(50,40) rotate(-12)">${body}</g>
          <path d="M 12 -42 C -50 -78 -120 -112 -160 -116" fill="none" stroke="rgba(255,255,255,0.20)" stroke-width="14" stroke-linecap="round"/>
          <path d="M -22 -36 C -80 -54 -134 -92 -160 -116" fill="none" stroke="rgba(255,255,255,0.20)" stroke-width="14" stroke-linecap="round"/>
        </g>
      `;
    }
    if(pose === "nap"){
      return `
        <g transform="translate(240,200)">
          <path d="M -140 40 C 30 -20 180 -10 250 45" fill="none" stroke="${P.accent}" stroke-width="10" stroke-linecap="round" opacity="0.75"/>
          <path d="M -140 40 C 30 -25 180 -15 250 40" fill="none" stroke="${P.accent2}" stroke-width="4" stroke-linecap="round" opacity="0.55"/>
          <g transform="translate(60,0) rotate(8)">${body}</g>
          <text x="-80" y="-60" fill="${P.ink}" opacity="0.45" font-size="42" font-family="ui-sans-serif, system-ui">Z</text>
          <text x="-40" y="-90" fill="${P.ink}" opacity="0.30" font-size="32" font-family="ui-sans-serif, system-ui">z</text>
        </g>
      `;
    }
    if(pose === "tea"){
      return `
        <g transform="translate(250,190)">
          <g transform="translate(50,10)">${body}</g>
          <path d="M 80 30 q 30 10 28 34 q -2 22 -30 28 q -24 6 -44 -14" fill="none" stroke="${P.accent2}" stroke-width="10" stroke-linecap="round" opacity="0.7"/>
          <path d="M 44 58 q 32 8 26 26" fill="none" stroke="${P.accent2}" stroke-width="6" stroke-linecap="round" opacity="0.55"/>
          <path d="M 65 -20 c 18 -30 26 -34 38 -44" fill="none" stroke="${P.accent}" stroke-width="6" stroke-linecap="round" opacity="0.55"/>
          <path d="M 78 -18 c 18 -30 26 -34 38 -44" fill="none" stroke="${P.accent}" stroke-width="6" stroke-linecap="round" opacity="0.35"/>
        </g>
      `;
    }
    if(pose === "wave"){
      return `
        <g transform="translate(260,195)">
          <g transform="translate(55,0)">${body}</g>
          <path d="M -10 -70 C 20 -110 50 -120 80 -100" fill="none" stroke="rgba(255,255,255,0.22)" stroke-width="14" stroke-linecap="round"/>
          <path d="M 72 -96 q 30 14 38 40" fill="none" stroke="${P.accent}" stroke-width="6" stroke-linecap="round" opacity="0.55"/>
          <path d="M 88 -92 q 28 18 28 44" fill="none" stroke="${P.accent2}" stroke-width="6" stroke-linecap="round" opacity="0.45"/>
        </g>
      `;
    }
    // leaf
    return `
      <g transform="translate(250,195)">
        <g transform="translate(55,0)">${body}</g>
        <path d="M -120 -40 C -60 -110 0 -92 34 -56 C -10 20 -90 30 -120 -40" fill="${P.accent}" opacity="0.35"/>
        <path d="M -112 -38 C -56 -96 -10 -84 22 -58" fill="none" stroke="${P.accent2}" stroke-width="4" opacity="0.5" stroke-linecap="round"/>
        <path d="M -84 -66 C -56 -52 -46 -32 -40 -6" fill="none" stroke="${P.accent2}" stroke-width="3" opacity="0.35" stroke-linecap="round"/>
      </g>
    `;
  };

  const msgLines = wrapText(msg, 26);
  const sigLine = safeText(sig);

  const stamp = pick([
    "SLOW MAIL",
    "POSTED FROM THE CANOPY",
    "AIR SLOTH",
    "PRIORITY: NAP",
    "HAND-CARRIED (EVENTUALLY)",
  ], rnd);

  const grains = (() => {
    const g = [];
    for(let i=0;i<220;i++){
      const x = Math.floor(rnd()*1000);
      const y = Math.floor(rnd()*600);
      const o = 0.015 + rnd()*0.03;
      g.push(`<rect x="${x}" y="${y}" width="1" height="1" fill="${P.ink}" opacity="${o.toFixed(3)}"/>`);
    }
    return g.join("");
  })();

  return `
  <svg xmlns="http://www.w3.org/2000/svg" width="1000" height="600" viewBox="0 0 1000 600">
    <defs>
      <linearGradient id="shine" x1="0" x2="1" y1="0" y2="1">
        <stop offset="0" stop-color="#ffffff" stop-opacity="0.10"/>
        <stop offset="1" stop-color="#ffffff" stop-opacity="0.00"/>
      </linearGradient>
      <filter id="soft" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="6" />
      </filter>
    </defs>

    <rect width="1000" height="600" rx="26" fill="${P.bg}"/>
    <rect width="1000" height="600" rx="26" fill="url(#shine)"/>

    <g>${bgPattern}</g>

    <g transform="translate(50,80)">
      <rect x="0" y="0" width="520" height="440" rx="22" fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.10)"/>
      <g transform="translate(34,60)">
        ${msgLines.map((l,i)=>`<text x="0" y="${i*54}" fill="${P.ink}" font-size="44" font-weight="650" font-family="ui-sans-serif, system-ui">${escapeXml(l)}</text>`).join("")}
        <text x="0" y="${msgLines.length*54 + 44}" fill="${P.ink}" opacity="0.78" font-size="30" font-weight="650" font-family="ui-sans-serif, system-ui">${escapeXml(sigLine)}</text>
      </g>
      <g transform="translate(34,360)">
        <text x="0" y="0" fill="${P.ink}" opacity="0.45" font-size="18" font-weight="800" letter-spacing="2" font-family="ui-sans-serif, system-ui">${escapeXml(stamp)}</text>
      </g>
    </g>

    <g transform="translate(520,40)">
      <rect x="0" y="0" width="430" height="520" rx="28" fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.10)"/>
      <circle cx="346" cy="96" r="62" fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.10)"/>
      <text x="346" y="110" text-anchor="middle" fill="${P.ink}" opacity="0.85" font-size="44" font-family="ui-sans-serif, system-ui">🦥</text>
      ${poseArt(pose)}
    </g>

    <g opacity="0.55">${grains}</g>
  </svg>`;
}

function escapeXml(unsafe){
  return String(unsafe)
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&apos;");
}

function download(filename, text, mime){
  const blob = new Blob([text], {type: mime});
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(()=> URL.revokeObjectURL(url), 2000);
}

async function svgToPng(svgText, opts = {}){
  const {
    width = 2000,
    height = 1200,
    background = "#000",
    // how to fit the SVG into the output canvas
    fit = "cover", // "cover" | "contain" | "stretch"
    srcWidth = 1000,
    srcHeight = 600,
  } = opts;

  const svgBlob = new Blob([svgText], {type: "image/svg+xml"});
  const url = URL.createObjectURL(svgBlob);
  try{
    const img = new Image();
    img.decoding = "async";
    await new Promise((res, rej)=>{ img.onload=res; img.onerror=rej; img.src=url; });

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");

    // background fill for transparent SVG bits
    ctx.fillStyle = background;
    ctx.fillRect(0,0,canvas.width,canvas.height);

    if(fit === "stretch"){
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    }else{
      const scaleX = width / srcWidth;
      const scaleY = height / srcHeight;
      const scale = (fit === "contain") ? Math.min(scaleX, scaleY) : Math.max(scaleX, scaleY);
      const drawW = srcWidth * scale;
      const drawH = srcHeight * scale;
      const dx = (width - drawW) / 2;
      const dy = (height - drawH) / 2;
      ctx.drawImage(img, dx, dy, drawW, drawH);
    }

    return await new Promise((res)=> canvas.toBlob(res, "image/png"));
  } finally {
    URL.revokeObjectURL(url);
  }
}

async function ogPngBlob(){
  // OG image is 1200x630 (1.91:1). Our SVG is 1000x600 (1.66:1), so we letterbox.
  const svgText = slothSVG(state);
  const P = PALETTES.find(p => p.id === state.pal) || PALETTES[0];
  return await svgToPng(svgText, {
    width: 1200,
    height: 630,
    background: P.bg,
    fit: "contain",
    srcWidth: 1000,
    srcHeight: 600,
  });
}

function blobDownload(filename, blob){
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(()=> URL.revokeObjectURL(url), 2000);
}

let state = { ...DEFAULTS, seed: (Math.random()*1e9)|0 };

function render(){
  // keep hash in sync
  writeHash(state);

  const svgText = slothSVG(state);
  $("svgMount").innerHTML = svgText;
}

function syncUIFromState(){
  $("pal").value = state.pal;
  $("pose").value = state.pose;
  $("msg").value = state.msg;
  $("sig").value = state.sig;
}

function randomize(){
  const rnd = xorshift32(((Math.random()*1e9)|0) ^ Date.now());
  state = {
    pal: pick(PALETTES, rnd).id,
    pose: pick(POSES, rnd).id,
    msg: pick([
      "Take it slow. You’re doing fine.",
      "If it can wait, it should.",
      "Progress counts even when it’s tiny.",
      "A nap is a plan.",
      "Small steps. Soft heart. Strong snack.",
      "Today’s priority: gentle persistence.",
      "You don’t have to sprint to arrive.",
    ], rnd),
    sig: pick(["— a sloth","— your slow pal","— the canopy committee","— sincerely, nap dept."], rnd),
    seed: ((Math.random()*1e9)|0)
  };
  syncUIFromState();
  render();
}

function setupSelect(id, items){
  const sel = $(id);
  sel.innerHTML = items.map(i => `<option value="${i.id}">${i.name}</option>`).join("");
}

function init(){
  setupSelect("pal", PALETTES);
  setupSelect("pose", POSES);

  const fromHash = readHash();
  if(fromHash){
    state = { ...DEFAULTS, ...fromHash };
  }
  syncUIFromState();

  $("btnRandom").addEventListener("click", () => { randomize(); setStatus("New slothcard generated."); });
  $("btnCopy").addEventListener("click", async () => {
    try{
      await navigator.clipboard.writeText(location.href);
      setStatus("Share link copied.");
    } catch {
      // fallback
      const ta = document.createElement("textarea");
      ta.value = location.href;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      ta.remove();
      setStatus("Share link copied.");
    }
  });
  const canCopyImage = !!(navigator.clipboard && window.ClipboardItem);
  if(!canCopyImage){
    // "Copy image" is only available in some browsers (notably Chromium-based).
    $("btnCopyImg").style.display = "none";
  }

  $("btnSvg").addEventListener("click", () => {
    const svgText = slothSVG(state);
    download("slothcard.svg", svgText, "image/svg+xml");
    setStatus("Downloaded SVG.");
  });

  $("btnCopyImg").addEventListener("click", async () => {
    if(!canCopyImage){
      setStatus("Copy image isn’t supported in this browser.");
      return;
    }
    try{
      setStatus("Rendering image…");
      const blob = await ogPngBlob();
      await navigator.clipboard.write([
        new ClipboardItem({ "image/png": blob })
      ]);
      setStatus("OG image copied.");
    } catch (e){
      console.error(e);
      setStatus("Copy image failed. Try downloading PNG instead.");
    }
  });

  $("btnPng").addEventListener("click", async () => {
    try{
      setStatus("Rendering PNG…");
      const svgText = slothSVG(state);
      const blob = await svgToPng(svgText);
      blobDownload("slothcard.png", blob);
      setStatus("Downloaded PNG.");
    } catch (e){
      console.error(e);
      setStatus("PNG export failed (browser blocked canvas). Try SVG.");
    }
  });

  // live updates
  for(const id of ["msg","sig","pal","pose"]){
    $(id).addEventListener("input", () => {
      state = { ...state, ...currentStateFromUI() };
      render();
    });
    $(id).addEventListener("change", () => {
      state = { ...state, ...currentStateFromUI() };
      render();
    });
  }

  $("year").textContent = new Date().getFullYear();

  render();
}

init();
