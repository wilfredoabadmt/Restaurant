# Plan — 003 · Identidad Visual, Tipografía Gastronómica y Paleta Criolla Gourmet

## Stack y Decisiones de Diseño

| Componente | Elección | Razón Técnica y Gastronómica |
| --- | --- | --- |
| **Fuente de Títulos** | `Playfair Display` (`next/font/google`) | Tipografía serif de alta alcurnia culinaria, evoca cartas de restaurante refinadas, recetas tradicionales y calidez de fuego a la leña. Optimizada sin FOUT mediante Next.js. |
| **Fuente de Cuerpo y UI** | `Outfit` (`next/font/google`) | Proporciones geométricas amables y legibilidad cristalina en móviles bajo luz ambiente de comedor. Excelente formato para números y cifras tabulares. |
| **Variables CSS de Tokens** | `--font-serif`, `--font-sans`, `--brasa`, `--amanecer`, `--oro`, `--panel`, `--ink` | Centralizadas en `globals.css` para aplicar uniformemente en landing, carta comensal, caja y gerencia. |
| **Esquema de Color** | Carbón Culinario + Brasa Viva + Maíz Ámbar | Transmite calidez, despierta apetito y ofrece una estética nocturna premium ("bistró criollo"). |
| **Micro-interacciones** | Resplandores suaves, elevación de tarjetas y botones con relieve | Da respuesta táctil y sensación de producto refinado y profesional. |

---

## Fases de Implementación

1. **Fase 1**: Configurar fuentes en `src/app/layout.tsx` mediante `next/font/google` con variables CSS `--font-serif` y `--font-sans`.
2. **Fase 2**: Rediseñar `src/app/globals.css` con la nueva paleta gastronómica, sombras de brasa, bordes sutiles y estilos de botones/tarjetas.
3. **Fase 3**: Pulir `src/app/page.tsx` (landing) con eslogan en `Playfair Display`, tarjeta de QR enmarcada con acabado de brasa y botones con resplandor.
4. **Fase 4**: Ajustar `src/app/menu/MenuClient.tsx` y `src/app/pedido/[id]/Comprobante.tsx` para aprovechar la nueva jerarquía tipográfica y acabados visuales.
5. **Fase 5**: Validar compilación local (`npm run build`), verificar que no haya regresiones y desplegar a producción en Coolify.
