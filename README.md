# TerraTrack ISR

<p><img src="https://github.com/belentani7/terratrack-isr/actions/workflows/ci.yml/badge.svg" alt="CI" style="vertical-align:middle">
  <img src="https://img.shields.io/badge/dependabot-enabled-025e8c?logo=dependabot&style=flat-square" alt="Dependabot">
  <img src="https://img.shields.io/website?url=https%3A%2F%2Fbelentani7.github.io%2Fterratrack-isr%2F&label=demo&style=flat-square&color=2bb673" alt="demo live"></p>

Plataforma de seguimiento táctico tipo ISR (Intelligence · Surveillance · Reconnaissance),
100% autocontenida en vanilla JS/Canvas — sin dependencias ni backend.

## Ejecutar

```bash
cd terratrack-isr
python -m http.server 8642
# abrir http://127.0.0.1:8642
```

## Qué hace

- **Mapa táctico** en canvas: terreno procedural (costa/islas/aguas someras), rejilla km,
  zona protegida, redes de sensores con barrido rotatorio.
- **Simulación continua**: entidades aéreas, de superficie y subsuperficiales entran y
  salen del área, navegan por waypoints y ejecutan maniobras evasivas aleatorias.
- **Red de sensores realista**: 2 radares, EO/IR de dron, array de sonar (solo detecta
  subs poco profundos) y fusión AIS. Cada sensor tiene alcance, probabilidad de
  detección dependiente de la distancia y tipos detectables; se pueden activar/desactivar.
- **Fusión de pistas**: las detecciones ruidosas alimentan un filtro alfa-beta por pista;
  las pistas pasan de PENDIENTE a CONFIRMADA con 3 contactos, ganan confianza,
  reducen su elipse de incertidumbre y hacen *dead-reckoning* entre detecciones
  (indicador "SIN CONTACTO" si envejecen).
- **Clasificación progresiva**: inicialmente DESCONOCIDO; el EO/IR y los contactos
  sostenidos revelan la afiliación real (HOSTIL/AMIGO/NEUTRAL).
- **Alertas**: un hostil (o desconocido de alta confianza) que penetra la zona protegida
  dispara alerta parpadeante y queda marcado con ⚠ y doble marco.
- **UI completa**: panel de sensores, capas conmutables (rejilla, estelas,
  incertidumbre...), lista de pistas ordenada por confianza, registro de eventos con
  reloj Zulu, tooltip y barra de detalle al hacer clic en una pista, control de
  velocidad 1–32× y pausa (Espacio).
- **Símbolos tipo NATO**: arco = aéreo, rectángulo = superficie, rombo = subsuperficial,
  con vector de velocidad e historial de posiciones.

## Estructura

```
index.html      — layout de la consola
css/style.css   — tema oscuro táctico
js/sim.js       — entidades, sensores, fusión de pistas, mundo
js/render.js    — mapa táctico en canvas
js/main.js      — UI y bucle principal (setInterval para sim, rAF para dibujo)
```

## Notas técnicas

- La simulación avanza con `setInterval` y el dibujo con `requestAnimationFrame`,
  de modo que la simulación no se congela si la pestaña pierde visibilidad.
- El `ResizeObserver` redimensiona el canvas cuando el layout está listo.
- Los imports llevan `?v=` para evitar la caché del navegador durante el desarrollo.
---

## Ficha del proyecto

| Campo | Valor |
|---|---|
| Autor | Belentani / NOIACORE |
| Época de desarrollo | 2026 |
| Contacto | [belentani7studio@proton.me](mailto:belentani7studio@proton.me) |
| Código | https://github.com/belentani7/terratrack-isr |
| Demo desplegada | https://belentani7.github.io/terratrack-isr/ |

Quality baseline: CI + Dependabot + CodeQL + reglas de agentes por [premium-factory](https://github.com/belentani7/premium-factory-api).


## Producto
Véase `plataforma/OFERTA.md`.
