// ============================================================
// TerraTrack ISR — Render del mapa táctico (canvas)
// ============================================================
import { WORLD, elevation, ALERT_ZONE, dist } from "./sim.js";

export const COLORS = {
  AIR: "#58b7ff", SURFACE: "#7dff9b", SUB: "#ffb1e0",
  HOSTIL: "#ff5c5c", AMIGO: "#58b7ff", NEUTRAL: "#5d7285", DESCONOCIDO: "#ffd166",
};

export class TactMap {
  constructor(canvas, world) {
    this.cv = canvas;
    this.ctx = canvas.getContext("2d");
    this.world = world;
    this.layers = { grid: true, sensors: true, zone: true, trails: true, uncert: true };
    this.selected = null;
    this.hover = null;
    this.mouse = { x: 0, y: 0, inside: false };
    this.terrainCache = null;
    this.resize();
    window.addEventListener("resize", () => this.resize());
    if (window.ResizeObserver) {
      new ResizeObserver(() => this.resize()).observe(canvas.parentElement);
    }
  }
  resize() {
    const r = this.cv.parentElement.getBoundingClientRect();
    if (r.width < 2 || r.height < 2) return;
    const w = Math.round(r.width * devicePixelRatio);
    const h = Math.round(r.height * devicePixelRatio);
    if (w === this.cv.width && h === this.cv.height) return;
    this.cv.width = w;
    this.cv.height = h;
    this.terrainCache = null;
  }
  // conversión mundo(km) -> píxeles
  get scale() {
    return Math.min(this.cv.width / WORLD.w, this.cv.height / WORLD.h);
  }
  get ox() { return (this.cv.width - WORLD.w * this.scale) / 2; }
  get oy() { return (this.cv.height - WORLD.h * this.scale) / 2; }
  toPx(x, y) { return [this.ox + x * this.scale, this.oy + (WORLD.h - y) * this.scale]; }
  toWorld(px, py) {
    return [(px - this.ox) / this.scale, WORLD.h - (py - this.oy) / this.scale];
  }

  drawTerrain() {
    const { ctx, cv } = this;
    if (this.terrainCache) { ctx.putImageData(this.terrainCache, 0, 0); return; }
    const off = document.createElement("canvas");
    off.width = cv.width; off.height = cv.height;
    const octx = off.getContext("2d");
    octx.fillStyle = "#04070a";
    octx.fillRect(0, 0, off.width, off.height);
    const step = 4;
    for (let py = 0; py < off.height; py += step) {
      for (let px = 0; px < off.width; px += step) {
        const [wx, wy] = this.toWorld(px, py);
        if (wx < 0 || wx > WORLD.w || wy < 0 || wy > WORLD.h) continue;
        const e = elevation(wx, wy);
        if (e > 0) {
          const h = Math.min(e * 1.8, 1);
          octx.fillStyle = `rgb(${10 + h * 40},${16 + h * 46},${12 + h * 30})`;
          octx.fillRect(px, py, step, step);
        } else if (e > -0.12) { // aguas someras
          octx.fillStyle = "rgba(20,60,80,.55)";
          octx.fillRect(px, py, step, step);
        }
      }
    }
    this.terrainCache = octx.getImageData(0, 0, off.width, off.height);
    ctx.putImageData(this.terrainCache, 0, 0);
  }

  drawGrid() {
    const { ctx } = this;
    ctx.strokeStyle = "rgba(53,224,200,.08)";
    ctx.fillStyle = "rgba(93,114,133,.6)";
    ctx.font = `${10 * devicePixelRatio}px Consolas, monospace`;
    ctx.lineWidth = 1;
    for (let gx = 0; gx <= WORLD.w; gx += 20) {
      const [x1, y1] = this.toPx(gx, WORLD.h), [x2, y2] = this.toPx(gx, 0);
      ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
      ctx.fillText(`${gx}km`, x1 + 3, y1 - 4);
    }
    for (let gy = 0; gy <= WORLD.h; gy += 20) {
      const [x1, y1] = this.toPx(0, gy), [x2, y2] = this.toPx(WORLD.w, gy);
      ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
      ctx.fillText(`${gy}km`, x1 + 3, y1 - 4);
    }
  }

  drawSensors() {
    const { ctx } = this;
    for (const s of this.world.sensors) {
      const [x, y] = this.toPx(s.x, s.y);
      const r = s.range * this.scale;
      ctx.strokeStyle = s.on ? "rgba(53,224,200,.28)" : "rgba(93,114,133,.12)";
      ctx.setLineDash([6, 6]);
      ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.stroke();
      ctx.setLineDash([]);
      // barrido rotatorio
      if (s.on && s.kind !== "AIS") {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(-s.sweep);
        const g2 = ctx.createLinearGradient(0, 0, r, 0);
        g2.addColorStop(0, "rgba(53,224,200,.18)");
        g2.addColorStop(1, "rgba(53,224,200,0)");
        ctx.fillStyle = g2;
        ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, r, -0.45, 0); ctx.closePath(); ctx.fill();
        ctx.restore();
      }
      ctx.fillStyle = s.on ? "#35e0c8" : "#5d7285";
      ctx.beginPath(); ctx.arc(x, y, 4 * devicePixelRatio, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "rgba(200,214,229,.85)";
      ctx.font = `${10 * devicePixelRatio}px Consolas, monospace`;
      ctx.fillText(s.name, x + 8 * devicePixelRatio, y + 3 * devicePixelRatio);
    }
  }

  drawZone() {
    const { ctx } = this;
    const [x, y] = this.toPx(ALERT_ZONE.x, ALERT_ZONE.y);
    const r = ALERT_ZONE.r * this.scale;
    ctx.strokeStyle = "rgba(255,92,92,.4)";
    ctx.setLineDash([10, 7]);
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = "rgba(255,92,92,.05)";
    ctx.fill();
    ctx.fillStyle = "rgba(255,92,92,.7)";
    ctx.font = `${10 * devicePixelRatio}px Consolas, monospace`;
    ctx.fillText("ZONA PROTEGIDA", x - 50 * devicePixelRatio, y - r - 6 * devicePixelRatio);
  }

  drawTracks() {
    const { ctx } = this;
    const dpr = devicePixelRatio;
    for (const t of this.world.tracks) {
      const [x, y] = this.toPx(t.x, t.y);
      const col = t.alerted ? COLORS.HOSTIL : COLORS[t.classification] || COLORS[t.entType];
      const alpha = 0.35 + t.confidence * 0.65;
      // estela
      if (this.layers.trails && t.trail.length > 1) {
        ctx.strokeStyle = `rgba(200,214,229,${0.12 + t.confidence * 0.15})`;
        ctx.lineWidth = 1 * dpr;
        ctx.beginPath();
        t.trail.forEach((p, i) => {
          const [tx, ty] = this.toPx(p[0], p[1]);
          i ? ctx.lineTo(tx, ty) : ctx.moveTo(tx, ty);
        });
        ctx.lineTo(x, y);
        ctx.stroke();
      }
      // incertidumbre
      if (this.layers.uncert && t.status !== "CONFIRMADA") {
        ctx.strokeStyle = `rgba(255,209,102,.35)`;
        ctx.setLineDash([4, 4]);
        ctx.beginPath(); ctx.arc(x, y, t.uncert * this.scale, 0, Math.PI * 2); ctx.stroke();
        ctx.setLineDash([]);
      }
      // símbolo NATO simplificado
      ctx.save();
      ctx.translate(x, y);
      ctx.globalAlpha = alpha;
      const s = 6 * dpr;
      if (t.entType === "AIR") { // arco superior
        ctx.strokeStyle = col; ctx.lineWidth = 1.6 * dpr;
        ctx.beginPath(); ctx.arc(0, 0, s, Math.PI, 2 * Math.PI); ctx.stroke();
      } else if (t.entType === "SURFACE") { // rectángulo
        ctx.strokeStyle = col; ctx.lineWidth = 1.6 * dpr;
        ctx.strokeRect(-s, -s, s * 2, s * 2);
      } else { // sub: rombo
        ctx.strokeStyle = col; ctx.lineWidth = 1.6 * dpr;
        ctx.beginPath();
        ctx.moveTo(0, -s); ctx.lineTo(s, 0); ctx.lineTo(0, s); ctx.lineTo(-s, 0);
        ctx.closePath(); ctx.stroke();
      }
      // vector de velocidad
      if (t.confidence > 0.3) {
        const vmag = Math.hypot(t.vx, t.vy);
        if (vmag > 0.01) {
          const ang = Math.atan2(-t.vy, t.vx); // y invertida en pantalla
          const len = s + 12 * dpr * Math.min(vmag / 0.25, 1);
          ctx.strokeStyle = col;
          ctx.beginPath(); ctx.moveTo(0, 0);
          ctx.lineTo(Math.cos(ang) * len, Math.sin(ang) * len); ctx.stroke();
        }
      }
      // hostil: doble marco
      if (t.classification === "HOSTIL") {
        ctx.strokeStyle = col;
        ctx.strokeRect(-s - 3 * dpr, -s - 3 * dpr, (s + 3 * dpr) * 2, (s + 3 * dpr) * 2);
      }
      ctx.restore();
      // etiqueta
      if (t.status === "CONFIRMADA" || t.hits > 1) {
        ctx.fillStyle = `rgba(200,214,229,${alpha})`;
        ctx.font = `${10 * dpr}px Consolas, monospace`;
        ctx.fillText(`TRK-${String(t.id).padStart(3, "0")}`, x + s + 4 * dpr, y - s);
        if (t.alerted) {
          ctx.fillStyle = COLORS.HOSTIL;
          ctx.fillText("⚠", x - 4 * dpr, y - s - 10 * dpr);
        }
      }
      // selección
      if (this.selected === t) {
        ctx.strokeStyle = "#35e0c8";
        ctx.setLineDash([3, 3]);
        ctx.beginPath(); ctx.arc(x, y, 14 * dpr, 0, Math.PI * 2); ctx.stroke();
        ctx.setLineDash([]);
      }
    }
  }

  draw() {
    const { ctx, cv } = this;
    ctx.clearRect(0, 0, cv.width, cv.height);
    this.drawTerrain();
    if (this.layers.grid) this.drawGrid();
    if (this.layers.zone) this.drawZone();
    if (this.layers.sensors) this.drawSensors();
    this.drawTracks();
  }

  pickTrack(px, py) {
    let best = null, bd = 16 * devicePixelRatio;
    for (const t of this.world.tracks) {
      const [x, y] = this.toPx(t.x, t.y);
      const d = dist(px, py, x, y);
      if (d < bd) { bd = d; best = t; }
    }
    return best;
  }
}
