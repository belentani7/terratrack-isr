# Política de seguridad

## Cómo reportar una vulnerabilidad

1. Usa los **reportes privados de vulnerabilidades de GitHub**: pestaña *Security* → *Report a vulnerability* de este repositorio.
2. No abras issues ni discusiones públicas con detalles técnicos de la vulnerabilidad.

## Qué incluir en el reporte

- Descripción del problema y tipo (secreto expuesto, inyección, XSS, CSRF, subida de archivos, etc.).
- Pasos mínimos para reproducirlo o prueba de concepto.
- Versión/commit afectado (`git rev-parse HEAD`) e impacto estimado.

## Tiempos de respuesta objetivo

| Severidad | Primera respuesta | Fix o mitigación |
|---|---|---|
| Alta (crítica) | 48 horas | inmediato |
| Media | 7 días | 7 días |
| Baja | 30 días | 30 días |

## Alcance

- Cubre el código de este repositorio en `main` y las etiquetas publicadas.
- Fuera de alcance: vulnerabilidades dependientes de una instalación sin actualizar, pruebas destructivas contra instancias en producción y phishing.

## Buenas prácticas para contribuir

- Nunca commitear secretos ni credenciales reales (usar `.env.example` con placeholders).
- Los cambios pasan por CI antes de fusionarse a `main`.

<!-- repo-forge:security:inicio -->
# Seguridad

## Reportar una vulnerabilidad

No abras un issue público. Usa el canal privado de GitHub Security del repositorio.
Incluye: versión o commit, pasos para reproducir, impacto y, si puedes, una corrección.

## Qué se considera vulnerabilidad

- Ejecución de código o comandos no previstos.
- Lectura o escritura de archivos fuera del alcance declarado.
- Exposición de credenciales en logs, informes o manifiestos.
- Dependencia con CVE conocido en una ruta ejecutable.

## Reglas del proyecto

- Ningún secreto se escribe en disco, en un log ni en un informe.
- Toda operación de escritura requiere `--apply` explícito.
- Las operaciones destructivas están bloqueadas por diseño.

<!-- repo-forge:security -->
<!-- repo-forge:security:fin -->
