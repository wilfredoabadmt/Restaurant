UPDATE "Pedido" p
SET codigo = t.code
FROM (
  SELECT id, substring(upper(md5(id::text || 'la-paila')), 1, 5) AS code
  FROM "Pedido"
  WHERE codigo IS NULL
) t
WHERE p.id = t.id
  AND NOT EXISTS (SELECT 1 FROM "Pedido" x WHERE x.codigo = t.code AND x.id <> p.id);
