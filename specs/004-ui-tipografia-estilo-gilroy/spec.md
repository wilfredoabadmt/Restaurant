# Especificación — 004 · Tipografía Geométrica Estilo Gilroy en Todos sus Estilos

## 1 · Intento y Alcance

Modernizar integralmente la experiencia de lectura y presentación visual de **La Paila** adoptando una tipografía geométrica **estilo Gilroy** (`Urbanist`) en toda la aplicación:
1. **Unificación Tipográfica**: Reemplazar la combinación previa con serifa por una familia geométrica de estilo Gilroy en todos sus cortes y pesos:
   - **Light / Regular (300 / 400)**: Descripciones de platos, notas de comanda y textos secundarios.
   - **Medium / SemiBold (500 / 600)**: Etiquetas de formulario, estados, pestañas y botones de acción.
   - **Bold / ExtraBold / Black (700 / 800 / 900)**: Nombre de la marca "La Paila", títulos de sección, nombres de platos y códigos de comanda (`#3504`).
   - **Itálica en todos los pesos**: Para acentos poéticos y eslóganes ("*Del fondo de la olla, directo a tu mesa*").
2. **Máxima Legibilidad en Pantalla (Mobile First)**:
   - Geometría circular pura y apertura limpia de caracteres que facilita la lectura instantánea en salones de restaurante con luz ambiente variable.
   - Cifras tabulares nítidas para precios en Bolivianos (`Bs 38.00`), totales y vueltos en caja.
3. **Estética Profesional y Vanguardista**:
   - Aspecto de aplicación gastronómica de nivel internacional (estilo bistró tech / apps modernas de alta gama).

---

## 2 · Historias de Usuario

**GIL-1 (P1) Lectura cristalina en toda la aplicación**
- **Dado** cualquier usuario (comensal en mesa por QR, cajero en turno o administrador en gerencia),
- **Cuando** visualiza cualquier pantalla, texto o botón,
- **Entonces** toda la interfaz utiliza la familia geométrica estilo Gilroy (`Urbanist`), con alta nitidez, espaciado proporcionado y sin mezclas incongruentes de serifas.

**GIL-2 (P1) Marca y encabezados contundentes**
- **Dado** los títulos principales de la landing, el menú y el panel de caja,
- **Cuando** el usuario ingresa,
- **Entonces** los encabezados destacan con peso ExtraBold / Black (800 / 900) con espaciado geométrico ajustado (`tracking-tight`), proyectando modernidad y autoridad gastronómica.

**GIL-3 (P1) Cifras numéricas y precios profesionales**
- **Dado** la visualización de precios, stocks de inventario y montos de caja,
- **Cuando** se listan productos o se calcula el total del pedido,
- **Entonces** los números se presentan con cifras tabulares perfectamente alineadas en peso `font-extrabold`.
