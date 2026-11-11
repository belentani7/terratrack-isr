# TerraTrack ISR

TerraTrack ISR es una experiencia web autocontenida para explorar una consola de vigilancia marítima y fusión de sensores. Incluye una página de producto y una simulación interactiva que corre en el navegador, sin cuentas, dependencias de ejecución ni backend.

> La consola muestra escenarios y contactos sintéticos. Es una demostración de interfaz y simulación, no un sistema operativo ni una fuente de datos reales.

## Producto

- **Página de presentación:** propuesta de valor, capacidades, recorrido del producto y acceso directo a la demo.
- **Mapa táctico:** terreno procedural, rejilla, zona protegida, coberturas y barrido de sensores.
- **Escenario dinámico:** entidades aéreas, de superficie y subsuperficiales navegan por el área y cambian de rumbo.
- **Sensores simulados:** radar, EO/IR, sonar y AIS; cada sensor se puede activar o desactivar.
- **Fusión de pistas:** las detecciones actualizan confianza, clasificación, posición estimada e historial.
- **Exploración:** capas de mapa, estelas, incertidumbre, velocidad variable, pausa, reinicio y detalle por pista.
- **Adaptable:** consola utilizable en escritorio y pantallas pequeñas; controles con teclado y tacto.

## Ejecutar localmente

Desde PowerShell 5.1, en la carpeta del repositorio:

```powershell
python -m http.server 8642
```

Abre `http://127.0.0.1:8642/` para la página de producto o `http://127.0.0.1:8642/app.html` para ir directamente a la consola. La demo necesita servirse por HTTP porque carga módulos JavaScript.

## Controles de la consola

- **Pausa / Reanudar:** botón de la barra superior o tecla Espacio.
- **Velocidad:** control deslizante de 1× a 32×.
- **Sensores y capas:** activa o desactiva elementos desde el panel izquierdo.
- **Pistas:** selecciónalas en el mapa o en la lista para ver sus detalles.
- **Reiniciar:** vuelve a cargar el escenario con entidades nuevas.

## Estructura

```text
index.html       Página de producto
app.html         Consola de simulación
hero.css         Estilos de la página de producto
hero.js          Fondo WebGL del hero con alternativa sin WebGL
css/style.css    Estilos de la consola
js/main.js       Interfaz y bucle principal
js/render.js     Renderizado del mapa Canvas
js/sim.js        Entidades, sensores, terreno y fusión de pistas
tests/           Pruebas estáticas y validación de sintaxis
```

## Verificación

```powershell
node --test tests/
```

## Proyecto

- Autor: Belentani / NOIACORE
- Código: [github.com/belentani7/terratrack-isr](https://github.com/belentani7/terratrack-isr)
- Contacto: [belentani7studio@proton.me](mailto:belentani7studio@proton.me)
- Licencia: MIT


## Producto
Véase `plataforma/OFERTA.md`, `plataforma/precios.json`, `plataforma/ONEPAGER.md`.
