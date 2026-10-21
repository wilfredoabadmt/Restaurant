// Picantería La Paila — semilla de datos
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

/** validaHasta = creadoEn + 40 min */
const valido = (creadoEn: Date) => new Date(creadoEn.getTime() + 40 * 60 * 1000);

async function main() {
  // limpiamos para que la semilla sea repetible
  await db.$transaction([
    db.auditoria.deleteMany({}),
    db.pedido.deleteMany({}),
    db.producto.deleteMany({}),
    db.categoria.deleteMany({}),
  ]);

  // ---- Usuarios
  const pwd = async (p: string) => await bcrypt.hash(p, 10);
  const admin = await db.usuario.upsert({
    where: { usuario: "admin" },
    update: {},
    create: {
      usuario: "admin",
      nombre: "Gerencia",
      apellidos: "La Paila",
      password: await pwd("admin123"),
      rol: "ADMIN",
    },
  });
  const jessica = await db.usuario.upsert({
    where: { usuario: "cajero1" },
    update: {},
    create: {
      usuario: "cajero1",
      nombre: "Jessica",
      apellidos: "Mamani Ríos",
      password: await pwd("cajero123"),
      rol: "CAJERO",
    },
  });
  const rolando = await db.usuario.upsert({
    where: { usuario: "cajero2" },
    update: {},
    create: {
      usuario: "cajero2",
      nombre: "Rolando",
      apellidos: "Torrez Salas",
      password: await pwd("cajero123"),
      rol: "CAJERO",
    },
  });

  // ---- Categorías
  const catPlatos = await db.categoria.upsert({
    where: { nombre: "Platos" },
    update: {},
    create: { nombre: "Platos", tipo: "PLATOS", orden: 1 },
  });
  const catBebidas = await db.categoria.upsert({
    where: { nombre: "Bebidas" },
    update: {},
    create: { nombre: "Bebidas", tipo: "BEBIDAS", orden: 2 },
  });
  const catPostres = await db.categoria.upsert({
    where: { nombre: "Postres" },
    update: {},
    create: { nombre: "Postres", tipo: "POSTRES", orden: 3 },
  });

  // ---- Productos (imagen "emoji:🍔" se renderiza; gerencia puede subir fotos)
  type ProdSeed = { nombre: string; descripcion: string; precio: number; stock: number; stockMin?: number; disponible?: boolean; emoji: string };

  const platos: ProdSeed[] = [
    { nombre: "Silpancho a la Chuquisaqueña", descripcion: "Milanesa de res, arroz, papas fritas, ensalada fresca y huevo frito.", precio: 38, stock: 24, emoji: "🍛" },
    { nombre: "Pique Macho (2 pers.)", descripcion: "Res, chorizos, papas, locoto y cebolla con brotes de mostaza.", precio: 68, stock: 15, emoji: "🍟" },
    { nombre: "Sopa de Maní", descripcion: "Clásica sopa paceña con costilla, mandioca y papas.", precio: 22, stock: 30, emoji: "🥣" },
    { nombre: "Picante de Pollo", descripcion: "Pollo guisado en ají colorado, papa sarnita, arroz y ensalada.", precio: 32, stock: 18, emoji: "🌶️" },
    { nombre: "Fricasé Paceño", descripcion: "Lechón de cerdo, choclo, mote y ensalada (fin de semana).", precio: 30, stock: 2, stockMin: 4, emoji: "🍖" },
    { nombre: "Majadito Camba", descripcion: "Arroz con charque, mandioca frita y huevo frito.", precio: 34, stock: 12, emoji: "🍚" },
    { nombre: "Churrasco Montero", descripcion: "Filete de res a la parrilla, papas, ensalada y aguacate.", precio: 52, stock: 16, emoji: "🥩" },
    { nombre: "Milanesa con Batido (2 pers.)", descripcion: "Doble milanesa casera, ensalada rusa y arroz.", precio: 45, stock: 10, emoji: "🥪" },
  ];
  const bebidas: ProdSeed[] = [
    { nombre: "Mocochinchi Artesanal", descripcion: "Refresco helado de mocochinchi con canela.", precio: 8, stock: 40, emoji: "🍑" },
    { nombre: "Refresco de Chicha (jarra)", descripcion: "Chicha helada con canela, la receta de la casa.", precio: 7, stock: 25, emoji: "🧃" },
    { nombre: "Jugo de Naranja (500 ml)", descripcion: "Natural, recién exprimido.", precio: 10, stock: 3, stockMin: 5, emoji: "🍊" },
    { nombre: "Coca-Cola 600 ml", descripcion: "Botella fría.", precio: 10, stock: 48, emoji: "🥤" },
    { nombre: "Cerveza Paceña", descripcion: "Botellín frío.", precio: 14, stock: 36, emoji: "🍺" },
    { nombre: "Agua Minevi (600 ml)", descripcion: "Botella fresca.", precio: 5, stock: 60, emoji: "💧" },
  ];
  const postres: ProdSeed[] = [
    { nombre: "Cocada Tradicional", descripcion: "Cocada criolla con coco, dulce y fría.", precio: 10, stock: 3, stockMin: 5, emoji: "🥥" },
    { nombre: "Buñuelo con Helado", descripcion: "Buñuelo casero con helado de vainilla y dulce de leche.", precio: 12, stock: 20, emoji: "🍩" },
    { nombre: "Tarta de Nuez", descripcion: "Porción con base crocante y caramelo.", precio: 18, stock: 8, emoji: "🥧" },
    { nombre: "Suspiro de Merengue", descripcion: "Bocadito crujiente de merengue con pasas.", precio: 9, stock: 30, emoji: "🍬" },
    { nombre: "Gelatina de Fresa", descripcion: "Gelatina natural de fresa con nata.", precio: 6, stock: 0, disponible: false, emoji: "🍮" },
  ];

  const prod = async (cId: number, arr: ProdSeed[]) => {
    const out = {} as Record<string, { id: number; precio: number; stock: number }>;
    for (const p of arr) {
      const r = await db.producto.create({
        data: {
          categoriaId: cId,
          nombre: p.nombre,
          descripcion: p.descripcion,
          precio: p.precio,
          imagen: `emoji:${p.emoji}`,
          stock: p.stock,
          stockMin: p.stockMin ?? 4,
          disponible: p.disponible ?? true,
        },
      });
      out[p.nombre] = { id: r.id, precio: p.precio, stock: p.stock };
    }
    return out;
  };

  const dictPlatos = await prod(catPlatos.id, platos);
  const dictBebidas = await prod(catBebidas.id, bebidas);
  const dictPostres = await prod(catPostres.id, postres);

  // ---- Pedidos de ejemplo (para ver reportes y el panel del cajero "vivos")
  // Pedido 1: enviado por QR hace 12 min, REGISTRADO, vence en 28 min
  const t1 = new Date(Date.now() - 12 * 60000);
  const p1 = await db.pedido.create({
    data: {
      codigo: "R7KQ2",
      alias: "Fernanda Q.",
      celular: "70012345",
      mensaje: "Sin ají en el colita, por favor.",
      estado: "REGISTRADO",
      servicio: "EN_LOCAL",
      total: 76,
      validoHasta: valido(t1),
      creadoEn: t1,
      items: {        create: [
          { productoId: dictPlatos["Picante de Pollo"].id, nombre: "Picante de Pollo", tipo: "PLATOS", precio: 32, cantidad: 2 },
          { productoId: dictBebidas["Mocochinchi Artesanal"].id, nombre: "Mocochinchi Artesanal", tipo: "BEBIDAS", precio: 8, cantidad: 2 },
        ],
      },
    },
  });
  void p1;

  // Pedido 2: LISTO (verificado), esperando pago
  const t2 = new Date(Date.now() - 25 * 60000);
  await db.pedido.create({
    data: {
      codigo: "JPCG9",
      alias: "Kevin V.",
      celular: "67788990",
      mensaje: "Llevar en envases separados.",
      estado: "LISTO",
      servicio: "PARA_LLEVAR",
      total: 52,
      validoHasta: valido(t2),
      creadoEn: t2,
      items: {
        create: [
          { productoId: dictPlatos["Churrasco Montero"].id, nombre: "Churrasco Montero", tipo: "PLATOS", precio: 52, cantidad: 1 },
        ],
      },
    },
  });

  // Pedido 3: pagado en efectivo hace 50 min (con vuelto)
  const t3 = new Date(Date.now() - 50 * 60000);
  await db.pedido.create({
    data: {
      codigo: "MWQ54",
      alias: "Mesa 4 — Familia Cruz",
      celular: "73022334",
      estado: "PAGADO",
      servicio: "EN_LOCAL",
      metodoPago: "EFECTIVO",
      montoRecibido: 200,
      vuelto: 22,
      total: 178,
      pagadoEn: new Date(t3.getTime() + 35 * 60000),
      validoHasta: valido(t3),
      creadoEn: t3,
      creadoPorId: jessica.id,
      items: {
        create: [
          { productoId: dictPlatos["Pique Macho (2 pers.)"].id, nombre: "Pique Macho (2 pers.)", tipo: "PLATOS", precio: 68, cantidad: 1 },
          { productoId: dictPlatos["Silpancho a la Chuquisaqueña"].id, nombre: "Silpancho a la Chuquisaqueña", tipo: "PLATOS", precio: 38, cantidad: 2 },
          { productoId: dictBebidas["Cerveza Paceña"].id, nombre: "Cerveza Paceña", tipo: "BEBIDAS", precio: 14, cantidad: 2 },
          { productoId: dictPostres["Buñuelo con Helado"].id, nombre: "Buñuelo con Helado", tipo: "POSTRES", precio: 12, cantidad: 2 },
        ],
      },
    },
  });

  // Pedido 4: pagado con QR hace 2 horas
  const t4 = new Date(Date.now() - 120 * 60000);
  await db.pedido.create({
    data: {
      codigo: "TQK83",
      alias: "Diana L.",
      celular: "78455667",
      estado: "PAGADO",
      servicio: "EN_LOCAL",
      metodoPago: "QR",
      total: 46,
      pagadoEn: new Date(t4.getTime() + 22 * 60000),
      validoHasta: valido(t4),
      creadoEn: t4,
      creadoPorId: jessica.id,
      items: {
        create: [
          { productoId: dictPlatos["Majadito Camba"].id, nombre: "Majadito Camba", tipo: "PLATOS", precio: 34, cantidad: 1 },
          { productoId: dictBebidas["Jugo de Naranja (500 ml)"].id, nombre: "Jugo de Naranja (500 ml)", tipo: "BEBIDAS", precio: 12, cantidad: 1 },
        ],
      },
    },
  });

  // Pedido 5: vencido → anulado automáticamente
  const t5 = new Date(Date.now() - 55 * 60000);
  await db.pedido.create({
    data: {
      codigo: "BXY92",
      alias: "Sin nombre",
      celular: "",
      estado: "ANULADO",
      total: 22,
      validoHasta: valido(t5),
      creadoEn: t5,
      anuladoEn: valido(t5),
      motivoAnulacion: "Automático: no se verificó el pedido dentro del plazo de 40 minutos.",
      items: {
        create: [
          { productoId: dictPlatos["Sopa de Maní"].id, nombre: "Sopa de Maní", tipo: "PLATOS", precio: 22, cantidad: 1 },
        ],
      },
    },
  });

  // ---- Auditoría de ejemplo
  await db.auditoria.create({
    data: {
      usuarioId: jessica.id,
      usuarioNombre: "cajero1",
      pedidoId: p1.id,
      accion: "CREADO",
      detalle: { nota: "Pedido recibido por QR" },
    },
  });

  console.log("Semilla lista: admin/admin123 · cajero1/cajero123 · cajero2/cajero123");
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
