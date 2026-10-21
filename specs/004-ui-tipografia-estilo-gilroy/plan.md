# Plan — 004 · Tipografía Geométrica Estilo Gilroy en Todos sus Estilos

## Arquitectura y Decisiones de Diseño

| Elemento | Elección | Justificación |
| --- | --- | --- |
| **Fuente Primaria Integral** | `Urbanist` (`next/font/google`) | La fuente libre de Google Fonts más fiel a las proporciones, círculos geométricos y pesos de **Gilroy**. Diseñada específicamente como una grotesca geométrica moderna inspirada en Gilroy y Futura. |
| **Estilos y Pesos Disponibles** | `300` (Light), `400` (Regular), `500` (Medium), `600` (SemiBold), `700` (Bold), `800` (ExtraBold), `900` (Black), con `normal` e `italic` | Cobertura total para cada nivel de jerarquía visual sin necesidad de fuentes secundarias. |
| **Integración Next.js 15** | Variable CSS `--font-gilroy` en `<html className="...">` | Inlining local de archivos woff2 durante la compilación, con optimización `display: "swap"` sin descargas bloqueantes. |
| **Compatibilidad de Clases** | `.brand`, `.serif`, `.font-sans` | Se reasignan todas a `var(--font-gilroy)` para que cada componente existente (menú, caja, gerencia, comprobante) herede la nueva estética de inmediato. |

---

## Fases de Implementación

1. **Fase 1**: Reemplazar en `src/app/layout.tsx` las fuentes anteriores por `Urbanist` con todos sus pesos (`300` a `900`) y estilos (`normal`, `italic`) bajo la variable CSS `--font-gilroy`.
2. **Fase 2**: Ajustar `src/app/globals.css` para definir `--font-gilroy` como fuente raíz del `body`, `.brand`, `.serif` y de los componentes.
3. **Fase 3**: Revisar `src/app/page.tsx` y `src/app/menu/MenuClient.tsx` para aprovechar los cortes `font-extrabold` (800) y `font-medium` (500), mejorando la legibilidad.
4. **Fase 4**: Validar con `npm run build` local, subir a GitHub (`main`) y desplegar en Coolify comprobando el estado `running:healthy`.
