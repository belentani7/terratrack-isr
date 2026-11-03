# AGENTS.md — belentani7/terratrack-isr

Instrucciones para agentes de código (Cursor, Claude Code, Codex, Gemini CLI).

## Stacks: web-estatico

## Ciclo de verificación

- Verificación manual: revisar el README.

## Reglas

- Evidence over claims: ejecuta la verificación antes de declarar éxito.
- Cambios mínimos y reversibles; un fix llega con su test.
- Nunca commitear secrets ni `.env`.

Ver estándares completos en `.cursor/rules/project.mdc`.
