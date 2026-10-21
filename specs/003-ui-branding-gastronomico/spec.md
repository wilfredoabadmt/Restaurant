# Especificación — 003 · Identidad Visual, Tipografía Gastronómica y Paleta Criolla Gourmet

## 1 · Intento y Alcance

Elevar la experiencia visual y percepción de valor de **La Paila** mediante una renovación integral de:
1. **Tipografía de Nicho Gastronómico**: Reemplazar las fuentes del sistema genéricas por una combinación de alta cocina:
   - **Títulos y Marca**: `Playfair Display` (serif editorial gourmet con elegancia tradicional criolla).
   - **Cuerpo, Tablas y Precios**: `Outfit` (sans-serif contemporánea, cálida, de alta legibilidad en pantallas móviles de clientes y números tabulares claros para precios en Bs).
2. **Gama de Colores Gastronómica Profesional**:
   - Inspirada en la cocina criolla a la leña, pailas de barro, rescoldos de brasa viva y maíz dorado.
   - Tonos cálidos oscuros profundos (`#0d0906`, `#17100b`, `#21160f`) que evitan grises fríos o negros planos.
   - Acentos de apetito: Brasa viva (`#ff5e28` a `#e04410`), Maíz / Sol naciente (`#fbbf24`), Oro miel (`#f59e0b`).
   - Tintas de marfil y crema suave (`#fdfbf7`, `#f4ede4`) y bronce atenuado (`#a69281`) que reducen la fatiga visual.
   - Estados culinarios de frescura: Menta fresca (`#10b981`), Rocoto picante (`#f43f5e`), Chicha/Bebida (`#38bdf8`).
3. **Micro-interacciones y Acabado Gourmet**:
   - Tarjetas con bordes sutiles iluminados en rescoldo (`rgba(255, 175, 110, 0.12)`).
   - Botones con relieve táctil, degradados vivos y resplandor al interactuar.
   - Menú digital responsivo de alta estética para comensales en mesa (código QR).

---

## 2 · Historias de Usuario

### Tipografía

**TYPO-1 (P1) Identidad tipográfica gastronómica**
- **Dado** cualquier usuario que visita la plataforma (landing, menú QR, panel o gerencia),
- **Cuando** lee los títulos de secciones, el nombre del restaurante o eslóganes,
- **Entonces** se muestran con `Playfair Display` (pesos 600, 700 e itálica), transmitiendo la tradición, prestigio y calidez de una auténtica picantería criolla.

**TYPO-2 (P1) Lectura óptima de ítems y precios**
- **Dado** un comensal navegando platos o un cajero operando pedidos rápidos,
- **Cuando** revisa descripciones, ingredientes y montos numéricos (`Bs 38.00`),
- **Entonces** el texto se renderiza con `Outfit`, con espaciado óptimo y cifras tabulares alineadas sin saltos visuales.

### Paleta de Colores

**PAL-1 (P1) Atmósfera nocturna de brasa y carbón gourmet**
- **Dado** el modo visual de la aplicación,
- **Cuando** se visualiza cualquier pantalla,
- **Entonces** el fondo proyecta un gradiente radial de brasas profundas sobre un lienzo carbón-madera (`#0d0906`), eliminando fondos fríos o grises estándar.

**PAL-2 (P1) Jerarquía de acentos estimulantes del apetito**
- **Dado** los llamados a la acción principales (botón "Pedir", "Pagar", "Ver el menú"),
- **Cuando** el usuario interactúa con ellos,
- **Entonces** destacan en un degradado vibrante de fuego criollo con resplandor suave, guiando la atención intuitivamente.

### Interfaz de Menú y Comprobante

**UI-1 (P1) Carta de comensal armonizada**
- **Dado** un cliente en mesa escaneando el código QR,
- **Cuando** explora las categorías (Platos, Bebidas, Postres),
- **Entonces** las tarjetas de producto, botones de cantidad y el resumen del carrito combinan armoniosamente con la nueva tipografía y paleta, sintiéndose como una carta física de alta cocina.
