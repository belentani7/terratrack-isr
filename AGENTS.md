# AGENTS.md — belentani7/terratrack-isr

Instrucciones para agentes de código (Cursor, Claude Code, Codex, Gemini CLI).

## Stacks: web-estatico

## Ciclo de verificación

- Servir el simulador: `python -m http.server` y abrir http://localhost:8000 — comprobar mapa, sensores y alertas. Tests: `node --test tests/`.

## Reglas

- Evidence over claims: ejecuta la verificación antes de declarar éxito.
- Cambios mínimos y reversibles; un fix llega con su test.
- Nunca commitear secrets ni `.env`.

Ver estándares completos en `.cursor/rules/project.mdc`.

<!-- repo-forge:agents:inicio -->
# AGENTS.md — instrucciones para agentes

Cualquier agente que toque **TerraTrack ISR** debe:

1. Leer `BIBLIA.md` y `plataforma/FICHA.md` antes de escribir.
2. Ejecutar `python scripts/doctor.py` al empezar y al terminar.
3. Respetar el techo de alcance: no añadir módulos que la ficha no describa.
4. No borrar archivos, no reescribir historia, no hacer push sin pedido explícito.
5. Declarar en el informe qué se ejecutó y qué no; lo no ejecutado no se afirma.

## Comandos seguros

| Comando | Efecto |
|---|---|
| `python scripts/doctor.py` | Solo lectura; devuelve el estado de reglas |
| `python -m unittest discover -s tests` | Pruebas locales |

<!-- repo-forge:agents -->
<!-- repo-forge:agents:fin -->
