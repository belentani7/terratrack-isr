// ============================================================
// TerraTrack ISR — Motor de simulación
// Entidades reales (estado verdadero) + sensores + fusión de pistas
// ============================================================

export const WORLD = { w: 200, h: 120 }; // km del área de operaciones

const rnd = (a, b) => a + Math.random() * (b - a);
const rndInt = (a, b) => Math.floor(rnd(a, b + 1));
const pick = (arr) => arr[rndInt(0, arr.length - 1)];
export const dist = (x1, y1, x2, y2) => Math.hypot(x2 - x1, y2 - y1);
export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

// ---------- Ruido determinista para el terreno ----------
function makeNoise(seed) {
  let s = seed;
  const rand = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  const g = new Array(256).fill(0).map(() => rand() - 0.5);
  return (x, y) => {
    const xi = Math.floor(x), yi = Math.floor(y);
    const xf = x - xi, yf = y - yi;
    const sx = xf * xf * (3 - 2 * xf), sy = yf * yf * (3 - 2 * yf);
    const at = (a, b) => g[((a * 73 + b * 149 + 1013) & 255)];
    const v = at(xi, yi) * (1 - sx) * (1 - sy) + at(xi + 1, yi) * sx * (1 - sy)
            + at(xi, yi + 1) * (1 - sx) * sy + at(xi + 1, yi + 1) * sx * sy;
    return v;
  };
}
const noise = makeNoise(42);

// Terreno: >0 tierra. Combinación de dos octavas + una gran masa de costa.
export function elevation(x, y) {
  const n = noise(x / 26, y / 26) * 1.0 + noise(x / 9, y / 9) * 0.35;
  const coast = 1 - Math.abs((x / WORLD.w) * 0.9 + (y / WORLD.h) * 0.5 - 0.55);
  return n + coast * 0.35 - 0.28;
}

// ---------- Entidades reales ----------
let nextEntityId = 1;
class Entity {
  constructor(t) {
    this.id = nextEntityId++;
    this.type = t.type;            // AIR | SURFACE | SUB
    this.x = t.x; this.y = t.y;
    this.cog = t.cog ?? rnd(0, 360);
    this.sog = t.sog;              // km/h
    this.alt = t.alt ?? 0;         // m (AIR) / profundidad negativa (SUB)
    this.allegiance = t.allegiance; // HOSTIL | AMIGO | NEUTRAL
    this.callsign = t.callsign;
    this.waypoints = t.waypoints || [];
    this.wp = 0;
    this.maneuverT = rnd(20, 90);  // s hasta maniobra evasiva aleatoria
    this.alive = true;
    this.exitT = rnd(300, 900);    // s en escena antes de salir
  }
  step(dt) {
    // navegación por waypoints
    if (this.waypoints.length) {
      const w = this.waypoints[this.wp];
      const want = (Math.atan2(w.y - this.y, w.x - this.x) * 180) / Math.PI;
      let d = ((want - this.cog + 540) % 360) - 180;
      this.cog += clamp(d, -40 * dt, 40 * dt);
      if (dist(this.x, this.y, w.x, w.y) < 3) this.wp = (this.wp + 1) % this.waypoints.length;
    }
    // maniobra ocasional
    this.maneuverT -= dt;
    if (this.maneuverT <= 0) {
      this.cog += rnd(-70, 70);
      this.sog = clamp(this.sog * rnd(0.8, 1.25), this.sog * 0.6, this.sog * 1.5);
      this.maneuverT = rnd(25, 120);
    }
    const r = (this.cog * Math.PI) / 180;
    this.x += Math.cos(r) * this.sog * dt / 3600;
    this.y += Math.sin(r) * this.sog * dt / 3600;
    // rebote en los bordes del mundo
    if (this.x < 2 || this.x > WORLD.w - 2) this.cog = 180 - this.cog;
    if (this.y < 2 || this.y > WORLD.h - 2) this.cog = -this.cog;
    this.x = clamp(this.x, 2, WORLD.w - 2);
    this.y = clamp(this.y, 2, WORLD.h - 2);
    this.exitT -= dt;
    if (this.exitT <= 0) this.alive = false;
  }
}

const AIR_CS = ["VIPER", "HALCÓN", "KOBRA", "ÁGUILA", "CUERVO", "DAGGER"];
const SEA_CS = ["ARGOS", "NAIAD", "TITÁN", "POSEIDÓN", "CICLÓN"];

function spawnEntity(edge) {
  // edge: 0 izq, 1 dercha, 2 arriba, 3 abajo, -1 interior
  let x, y;
  if (edge === -1) { x = rnd(20, WORLD.w - 20); y = rnd(15, WORLD.h - 15); }
  else if (edge === 0) { x = 3; y = rnd(10, WORLD.h - 10); }
  else if (edge === 1) { x = WORLD.w - 3; y = rnd(10, WORLD.h - 10); }
  else if (edge === 2) { x = rnd(10, WORLD.w - 10); y = 3; }
  else { x = rnd(10, WORLD.w - 10); y = WORLD.h - 3; }
  const r = Math.random();
  const type = r < 0.5 ? "AIR" : r < 0.85 ? "SURFACE" : "SUB";
  const algR = Math.random();
  const allegiance = algR < 0.3 ? "HOSTIL" : algR < 0.55 ? "AMIGO" : algR < 0.8 ? "NEUTRAL" : "DESCONOCIDO";
  const base = {
    AIR:     { sog: rnd(420, 900), alt: rnd(1500, 11000) },
    SURFACE: { sog: rnd(18, 42),   alt: 0 },
    SUB:     { sog: rnd(8, 22),    alt: -rnd(30, 250) },
  }[type];
  // rumbo hacia el interior
  const cog = (Math.atan2(WORLD.h / 2 - y, WORLD.w / 2 - x) * 180) / Math.PI + rnd(-30, 30);
  const wp = { x: clamp(WORLD.w - x, 10, WORLD.w - 10), y: clamp(WORLD.h - y + rnd(-30, 30), 8, WORLD.h - 8) };
  return new Entity({
    type, x, y, cog, allegiance,
    sog: base.sog, alt: base.alt,
    callsign: `${pick(type === "AIR" ? AIR_CS : SEA_CS)}-${rndInt(10, 99)}`,
    waypoints: [wp],
  });
}

// ---------- Sensores ----------
let nextSensorId = 1;
class Sensor {
  constructor(s) {
    this.id = nextSensorId++;
    this.name = s.name; this.kind = s.kind; // RADAR | EOIR | SONAR | AIS
    this.x = s.x; this.y = s.y; this.range = s.range;
    this.on = true;
    this.detects = s.detects; // tipos detectables
    this.pK = s.pK;           // prob. de detección base a media distancia
    this.sweep = 0;
  }
  step(dt) { this.sweep = (this.sweep + dt * 1.2) % (Math.PI * 2); }
  canDetect(ent) {
    if (!this.on) return false;
    if (!this.detects.includes(ent.type)) return false;
    const d = dist(this.x, this.y, ent.x, ent.y);
    if (d > this.range) return false;
    // Subs solo detectables por sonar si están poco profundos
    if (this.kind === "SONAR" && ent.type === "SUB" && ent.alt < -180) return false;
    const p = this.pK * (1.15 - 0.5 * (d / this.range));
    return Math.random() < clamp(p, 0, 1);
  }
}

export function defaultSensors() {
  nextSensorId = 1;
  return [
    new Sensor({ name: "RADAR NORTE",  kind: "RADAR", x: 60,  y: 78,  range: 46, pK: 0.55, detects: ["AIR", "SURFACE"] }),
    new Sensor({ name: "RADAR SUR",    kind: "RADAR", x: 130, y: 26,  range: 40, pK: 0.55, detects: ["AIR", "SURFACE"] }),
    new Sensor({ name: "EO/IR DRON",   kind: "EOIR",  x: 96,  y: 58,  range: 26, pK: 0.75, detects: ["AIR", "SURFACE"], }),
    new Sensor({ name: "SONAR ARRAY",  kind: "SONAR", x: 105, y: 96,  range: 34, pK: 0.5,  detects: ["SUB", "SURFACE"] }),
    new Sensor({ name: "AIS FUSIÓN",   kind: "AIS",   x: 100, y: 60,  range: 85, pK: 0.9,  detects: ["SURFACE"] }),
  ];
}

// ---------- Pistas (track fusion) ----------
let nextTrackId = 1;
class Track {
  constructor(det, t0) {
    this.id = nextTrackId++;
    this.born = t0;
    this.lastSeen = t0;
    this.status = "PENDIENTE"; // PENDIENTE | CONFIRMADA
    this.hits = 1;
    this.sources = new Set([det.sensor.name]);
    this.entType = det.ent.type;
    // estimación con ruido
    this.x = det.ent.x + rnd(-1.5, 1.5);
    this.y = det.ent.y + rnd(-1.5, 1.5);
    this.vx = 0; this.vy = 0;
    this.trail = [];
    this.uncert = 6; // km, radio de incertidumbre
    this.classification = "DESCONOCIDO";
    this.alerted = false;
    this.confidence = 0.15;
  }
  fuse(det, dt, t0) {
    this.hits++;
    this.lastSeen = t0;
    this.sources.add(det.sensor.name);
    // medición ruidosa + suavizado tipo alfa-beta
    const mx = det.ent.x + rnd(-1.2, 1.2), my = det.ent.y + rnd(-1.2, 1.2);
    const a = clamp(0.35 * this.confidence + 0.15, 0.15, 0.5);
    const nvx = (mx - this.x) / Math.max(dt, 1);
    const nvy = (my - this.y) / Math.max(dt, 1);
    this.vx = this.vx * (1 - a) + nvx * a;
    this.vy = this.vy * (1 - a) + nvy * a;
    this.x += (mx - this.x) * a;
    this.y += (my - this.y) * a;
    this.uncert = clamp(this.uncert - 0.8, 1.2, 8);
    this.confidence = clamp(this.confidence + 0.12, 0, 1);
    if (this.hits >= 3 && this.status === "PENDIENTE") this.status = "CONFIRMADA";
    // EO/IR y más hits mejoran la clasificación
    if (det.sensor.kind === "EOIR" && this.hits > 5) this.classification = det.ent.allegiance;
    else if (this.hits > 8) this.classification = det.ent.allegiance;
  }
  coast(dt) {
    // dead-reckoning entre detecciones
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.uncert = clamp(this.uncert + 0.15 * dt, 1.2, 14);
    this.confidence = clamp(this.confidence - 0.02 * dt, 0, 1);
  }
  get stale() { return this.confidence < 0.06; }
}

// ---------- Zona de exclusión / alerta ----------
export const ALERT_ZONE = { x: 100, y: 60, r: 22 };

// ---------- Mundo ----------
export class World {
  constructor() {
    this.t = 0; // segundos de simulación
    this.entities = [];
    this.sensors = defaultSensors();
    this.tracks = [];
    this.events = [];
    this.spawnTimer = 2;
    this.pending = new Map(); // entityId -> Track
    for (let i = 0; i < 10; i++) this.entities.push(spawnEntity(i < 5 ? -1 : rndInt(0, 3)));
  }
  log(kind, msg) {
    this.events.unshift({ t: this.t, kind, msg });
    if (this.events.length > 120) this.events.pop();
  }
  step(dt) {
    this.t += dt;
    // spawn continuo de entidades
    this.spawnTimer -= dt;
    if (this.spawnTimer <= 0 && this.entities.length < 14) {
      this.entities.push(spawnEntity(rndInt(0, 3)));
      this.spawnTimer = rnd(12, 35);
    }
    this.entities.forEach((e) => e.step(dt));
    this.sensors.forEach((s) => s.step(dt));

    // detecciones -> asociación por cercanía al ente real (verdad-ground)
    const dets = [];
    for (const ent of this.entities) {
      if (!ent.alive) continue;
      for (const s of this.sensors) if (s.canDetect(ent)) dets.push({ ent, sensor: s });
    }

    // fusión: cada entidad alimenta su pista
    const seen = new Set();
    for (const d of dets) {
      seen.add(d.ent.id);
      let trk = this.pending.get(d.ent.id);
      if (!trk) {
        trk = new Track(d, this.t);
        this.pending.set(d.ent.id, trk);
        this.tracks.push(trk);
        this.log("new", `PISTA NUEVA TRK-${String(trk.id).padStart(3, "0")} — ${d.ent.type} (${d.sensor.name})`);
      } else {
        trk.fuse(d, Math.max(this.t - trk.lastSeen, 1), this.t);
      }
    }
    // coasting para pistas sin detección este tick
    for (const [entId, trk] of this.pending) {
      if (!seen.has(entId)) trk.coast(dt);
    }
    // limpieza: entidad muerta + pista agotada
    for (const ent of this.entities) {
      if (!ent.alive && this.pending.has(ent.id)) {
        const trk = this.pending.get(ent.id);
        if (trk.stale) { this.pending.delete(ent.id); trk.dropped = true; }
      }
    }
    this.entities = this.entities.filter((e) => e.alive);
    this.tracks = this.tracks.filter((t) => !t.dropped && !(t.stale && !this.pendingHas(t)));
    this.pending = new Map([...this.pending].filter(([id, t]) => !t.dropped && !t.stale));

    // alertas: hostil confirmado entrando en la zona
    for (const t of this.tracks) {
      if (t.status !== "CONFIRMADA" || t.alerted) continue;
      if ((t.classification === "HOSTIL" || t.classification === "DESCONOCIDO" && t.confidence > 0.7)
          && dist(t.x, t.y, ALERT_ZONE.x, ALERT_ZONE.y) < ALERT_ZONE.r) {
        t.alerted = true;
        this.alerts = (this.alerts || 0) + 1;
        this.log("alert", `⚠ ALERTA: ${t.classification} TRK-${String(t.id).padStart(3, "0")} penetra zona protegida`);
      }
    }
  }
  pendingHas(trk) { return [...this.pending.values()].includes(trk); }
}
