// ============================================================
// TerraTrack ISR — UI y bucle principal
// ============================================================
import { World, WORLD, ALERT_ZONE, dist } from "./sim.js?v=3";
import { TactMap, COLORS } from "./render.js?v=2";

window.addEventListener("error", (e) => {
  document.title = `ERR: ${e.message} @${e.lineno}`;
  console.error(e.error || e.message);
});
window.__TT_VERSION__ = "v2-interval";

const world = new World();
const map = new TactMap(document.getElementById("map"), world);

let playing = true;
let speed = 4;
const SIM_DT = 0.5; // s de sim por tick lógico

const $ = (id) => document.getElementById(id);
const zulu = (t) => {
  const h = Math.floor(t / 3600) % 24, m = Math.floor(t / 60) % 60, s = Math.floor(t) % 60;
  const p = (n) => String(n).padStart(2, "0");
  return `${p(h)}:${p(m)}:${p(s)}Z`;
};
const TYPE_ES = { AIR: "AÉREO", SURFACE: "SUPERFICIE", SUB: "SUBSUPERFICIAL" };
const ALG_ES = { HOSTIL: "hostil", AMIGO: "amigo", NEUTRAL: "neutral", DESCONOCIDO: "desconocido" };

// ---------- Registro de estelas (cada pocos ticks) ----------
let trailAcc = 0;

// ---------- Paneles ----------
function buildSensorPanel() {
  const box = $("sensorList");
  box.innerHTML = "";
  for (const s of world.sensors) {
    const el = document.createElement("div");
    el.className = "sensor on";
    el.innerHTML = `
      <div class="row"><span class="nm">${s.name}</span><span class="st on">ACTIVO</span></div>
      <div class="meta">${s.kind} · ${s.range} km · (${s.x}, ${s.y})</div>`;
    el.onclick = () => {
      s.on = !s.on;
      el.classList.toggle("on", s.on);
      el.querySelector(".st").textContent = s.on ? "ACTIVO" : "OFF";
      el.querySelector(".st").className = `st ${s.on ? "on" : "off"}`;
      world.log("info", `${s.name} ${s.on ? "activado" : "desactivado"}`);
    };
    box.appendChild(el);
  }
}
function buildLayerToggles() {
  const names = { grid: "Rejilla", sensors: "Sensores", zone: "Zona protegida", trails: "Estelas", uncert: "Incertidumbre" };
  const box = $("layerToggles");
  box.innerHTML = "";
  for (const k of Object.keys(names)) {
    const l = document.createElement("label");
    l.className = "layer";
    l.innerHTML = `<input type="checkbox" ${map.layers[k] ? "checked" : ""}> ${names[k]}`;
    l.querySelector("input").onchange = (e) => { map.layers[k] = e.target.checked; };
    box.appendChild(l);
  }
}
function renderTrackList() {
  const box = $("trackList");
  const tracks = [...world.tracks].sort((a, b) => b.confidence - a.confidence);
  box.innerHTML = "";
  for (const t of tracks) {
    const el = document.createElement("div");
    el.className = "track" + (map.selected === t ? " sel" : "");
    const stale = world.t - t.lastSeen > 30;
    const spd = Math.hypot(t.vx, t.vy) * 3600;
    el.innerHTML = `
      <div class="row1">
        <span class="tid" style="color:${COLORS[t.entType]}">TRK-${String(t.id).padStart(3, "0")}</span>
        <span class="tclass ${ALG_ES[t.classification] || "desconocido"}">${t.classification}</span>
      </div>
      <div class="meta ${stale ? "staleness" : ""}">
        ${TYPE_ES[t.entType]} · ${t.status} · ${(spd).toFixed(0)} km/h · CONF ${(t.confidence * 100).toFixed(0)}%
        ${stale ? " · SIN CONTACTO" : ""}
      </div>`;
    el.onclick = () => selectTrack(t);
    box.appendChild(el);
  }
}
function renderEventLog() {
  $("eventLog").innerHTML = world.events
    .slice(0, 60)
    .map((e) => `<div class="ev-${e.kind}"><span class="tstamp">${zulu(e.t)}</span> ${e.msg}</div>`)
    .join("");
}
function updateStatus() {
  $("chipClock").textContent = zulu(world.t);
  const on = world.sensors.filter((s) => s.on).length;
  const c = $("chipSensors");
  c.textContent = `SENSORES ${on}/${world.sensors.length}`;
  c.classList.toggle("ok", on > 0);
  $("chipTracks").textContent = `PISTAS ${world.tracks.length}`;
  const alerts = world.events.filter((e) => e.kind === "alert").length;
  $("alertCount").textContent = alerts;
  $("chipAlerts").hidden = alerts === 0;
}
function selectTrack(t) {
  map.selected = t;
  const bar = $("detailBar");
  if (!t) { bar.hidden = true; return; }
  bar.hidden = false;
  $("dId").textContent = `TRK-${String(t.id).padStart(3, "0")}`;
  $("dId").style.color = COLORS[t.entType];
  $("dType").textContent = TYPE_ES[t.entType];
  $("dClass").textContent = t.classification;
  const spd = Math.hypot(t.vx, t.vy) * 3600;
  const cog = ((Math.atan2(t.vy, t.vx) * 180) / Math.PI + 360) % 360;
  $("dPos").textContent = `${t.x.toFixed(1)}, ${t.y.toFixed(1)} km`;
  $("dCog").textContent = spd > 1 ? `${cog.toFixed(0)}°` : "—";
  $("dSog").textContent = `${spd.toFixed(0)} km/h`;
  $("dAlt").textContent = t.entType === "SUB" ? "submarcado" : "n/d";
  $("dSrc").textContent = [...t.sources].join(", ");
  $("dConf").textContent = `${(t.confidence * 100).toFixed(0)}% (±${t.uncert.toFixed(1)} km)`;
  $("dHist").textContent =
    `${t.hits} detecciones desde ${zulu(t.born)} · última ${zulu(t.lastSeen)}`;
}
$("dClose").onclick = () => selectTrack(null);

// ---------- Interacción con el mapa ----------
const cv = $("map");
cv.addEventListener("mousemove", (e) => {
  const r = cv.getBoundingClientRect();
  const px = (e.clientX - r.left) * devicePixelRatio;
  const py = (e.clientY - r.top) * devicePixelRatio;
  const [wx, wy] = map.toWorld(px, py);
  $("cursorPos").textContent =
    wx >= 0 && wx <= WORLD.w && wy >= 0 && wy <= WORLD.h ? `X ${wx.toFixed(0)} · Y ${wy.toFixed(0)} km` : "—";
  const tip = $("trackTooltip");
  const t = map.pickTrack(px, py);
  map.hover = t;
  if (t) {
    tip.hidden = false;
    tip.innerHTML =
      `<b style="color:${COLORS[t.entType]}">TRK-${String(t.id).padStart(3, "0")}</b><br>` +
      `${TYPE_ES[t.entType]} · ${t.classification}<br>CONF ${(t.confidence * 100).toFixed(0)}% · ${t.status}`;
    tip.style.left = `${e.clientX - r.left + 14}px`;
    tip.style.top = `${e.clientY - r.top + 10}px`;
  } else tip.hidden = true;
});
cv.addEventListener("mouseleave", () => { $("trackTooltip").hidden = true; });
cv.addEventListener("click", (e) => {
  const r = cv.getBoundingClientRect();
  const t = map.pickTrack((e.clientX - r.left) * devicePixelRatio, (e.clientY - r.top) * devicePixelRatio);
  selectTrack(t);
});

// ---------- Controles ----------
$("btnPlay").onclick = () => {
  playing = !playing;
  $("btnPlay").textContent = playing ? "⏸ Pausa" : "▶ Reanudar";
};
document.addEventListener("keydown", (e) => {
  if (e.code === "Space") { e.preventDefault(); $("btnPlay").click(); }
});
$("speed").oninput = (e) => {
  speed = +e.target.value;
  $("speedVal").textContent = `${speed}×`;
};
$("btnReset").onclick = () => {
  location.reload();
};

// ---------- Bucle principal ----------
let last = performance.now();
let uiAcc = 0;
function tick(real) {
  if (playing) {
    const simTime = real * speed;
    let done = 0;
    while (done < simTime) {
      const dt = Math.min(SIM_DT, simTime - done);
      world.step(dt);
      done += dt;
    }
    trailAcc += real;
    if (trailAcc > 1.2) {
      trailAcc = 0;
      for (const t of world.tracks) {
        t.trail.push([t.x, t.y]);
        if (t.trail.length > 40) t.trail.shift();
      }
    }
  }
  uiAcc += real;
  if (uiAcc > 0.25) {
    uiAcc = 0;
    renderTrackList();
    renderEventLog();
    updateStatus();
    if (map.selected && !world.tracks.includes(map.selected)) selectTrack(null);
    else if (map.selected) selectTrack(map.selected);
  }
}
// la simulación avanza con setInterval (no se pausa si la pestaña está en segundo plano)
let simLast = performance.now();
setInterval(() => {
  const now = performance.now();
  const real = Math.min((now - simLast) / 1000, 0.5);
  simLast = now;
  tick(real);
}, 250);
// el dibujo con rAF; si está pausado, redibuja cada 500 ms
setInterval(() => { if (document.hidden) map.draw(); }, 500);
function frame(now) {
  const real = Math.min((now - last) / 1000, 0.2);
  last = now;
  map.draw();
  requestAnimationFrame(frame);
}

buildSensorPanel();
buildLayerToggles();
world.log("info", "Sistema TerraTrack ISR iniciado — fusión multicensor en línea");
requestAnimationFrame(frame);
