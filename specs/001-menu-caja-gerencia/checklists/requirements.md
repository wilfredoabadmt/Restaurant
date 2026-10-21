# Checklist de calidad de requisitos — 001

- [x] Cada historia tiene escenario verificable (dado/cuando/entonces).
- [x] Las reglas medibles (40/30 min, Bs, justificación, stock años) aparecen en la spec y en el código (constantes o validadores).
- [x] Sin ambigüedades de rol: las capacidades de cajero y gerencia están separadas por capítulo y por middleware.
- [x] Estados de pedido finitos y dibujados: REGISTRADO → LISTO → PAGADO locales con ANULADO transversal.
- [x] Errores visibles en español y accionables ("Solo quedan 3 uds de «X»").
- [x] Responsividad: cada página se ensaya a 390 px (móvil) y 1280 px (caja/gerencia).
- [x] Accesibilidad básica: focus visible (outline ámbar), labels en todos los inputs de formularios persistentes, botones con aria-label en steppers.
- [x] Auditoría: create/modify/delete/pay/annul/stock con usuario + hora + motivo.
- [x] Idempotencia de la demo: la semilla es repetible (limpia y recarga).
- [x] Pública vs protegida: solo `/menu`, `/pedido/:id`, portada, `/api/menu` y `POST /api/pedidos` son sin sesión; el resto cerrado.
