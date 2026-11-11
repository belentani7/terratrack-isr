

<!-- repo-forge:docs-arquitectura:inicio -->
# Arquitectura

## Tipo

sitio estático publicable tal cual

## Piezas observadas

| Pieza | Evidencia |
|---|---|
| Lenguajes | JavaScript 52.3%, HTML 24.2%, CSS 14.6%, Markdown 7.4%, JSON 1.4% |
| Puntos de entrada | ninguno detectado |
| Páginas HTML | 3 |
| Tests | 1 archivos |
| Dependencias de paquete | 0 |

## Capas propuestas

```text
contenido/      datos y textos versionados
plataforma/     ficha, diseño y contrato del producto
brand/          tokens, marca y activos
scripts/        verificación y operación
tests/          pruebas ejecutables
```

La propuesta no mueve archivos existentes: describe dónde debe vivir lo nuevo para que
el repositorio siga siendo legible.

## Deuda declarada

- 5 lenguajes: coste de contexto alto.

<!-- repo-forge:arquitectura -->
<!-- repo-forge:docs-arquitectura:fin -->
