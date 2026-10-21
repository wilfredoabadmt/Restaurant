--
-- PostgreSQL database dump
--

\restrict UpeRYEHFpY4TQDDE5BYmD5Wl8wX5Ckaq4dihqrnIXLeO0Jfdw8CfA9bnEu6Iv1W

-- Dumped from database version 14.24
-- Dumped by pg_dump version 14.24

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: EstadoPedido; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."EstadoPedido" AS ENUM (
    'REGISTRADO',
    'LISTO',
    'PAGADO',
    'ANULADO'
);


--
-- Name: MetodoPago; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."MetodoPago" AS ENUM (
    'EFECTIVO',
    'QR'
);


--
-- Name: Rol; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."Rol" AS ENUM (
    'ADMIN',
    'CAJERO'
);


--
-- Name: Tipo; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."Tipo" AS ENUM (
    'PLATOS',
    'BEBIDAS',
    'POSTRES'
);


--
-- Name: TipoServicio; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."TipoServicio" AS ENUM (
    'EN_LOCAL',
    'PARA_LLEVAR'
);


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: Auditoria; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Auditoria" (
    id integer NOT NULL,
    "usuarioId" integer,
    "usuarioNombre" text NOT NULL,
    "pedidoId" integer,
    accion text NOT NULL,
    justificacion text,
    detalle jsonb,
    "creadoEn" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: Auditoria_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."Auditoria_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: Auditoria_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."Auditoria_id_seq" OWNED BY public."Auditoria".id;


--
-- Name: Categoria; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Categoria" (
    id integer NOT NULL,
    nombre text NOT NULL,
    tipo public."Tipo" DEFAULT 'PLATOS'::public."Tipo" NOT NULL,
    orden integer DEFAULT 0 NOT NULL,
    activa boolean DEFAULT true NOT NULL
);


--
-- Name: Categoria_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."Categoria_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: Categoria_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."Categoria_id_seq" OWNED BY public."Categoria".id;


--
-- Name: Pedido; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Pedido" (
    id integer NOT NULL,
    alias text DEFAULT 'Pendiente'::text NOT NULL,
    celular text DEFAULT ''::text NOT NULL,
    mensaje text DEFAULT ''::text,
    estado public."EstadoPedido" DEFAULT 'REGISTRADO'::public."EstadoPedido" NOT NULL,
    servicio public."TipoServicio" DEFAULT 'EN_LOCAL'::public."TipoServicio" NOT NULL,
    "metodoPago" public."MetodoPago",
    "montoRecibido" numeric(10,2),
    vuelto numeric(10,2),
    total numeric(10,2) NOT NULL,
    "validoHasta" timestamp(3) without time zone NOT NULL,
    "anuladoEn" timestamp(3) without time zone,
    "motivoAnulacion" text,
    "creadoEn" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "pagadoEn" timestamp(3) without time zone,
    "creadoPorId" integer,
    codigo text
);


--
-- Name: PedidoItem; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."PedidoItem" (
    id integer NOT NULL,
    "pedidoId" integer NOT NULL,
    "productoId" integer,
    nombre text NOT NULL,
    tipo public."Tipo" NOT NULL,
    precio numeric(10,2) NOT NULL,
    cantidad integer NOT NULL
);


--
-- Name: PedidoItem_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."PedidoItem_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: PedidoItem_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."PedidoItem_id_seq" OWNED BY public."PedidoItem".id;


--
-- Name: Pedido_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."Pedido_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: Pedido_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."Pedido_id_seq" OWNED BY public."Pedido".id;


--
-- Name: Producto; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Producto" (
    id integer NOT NULL,
    "categoriaId" integer NOT NULL,
    nombre text NOT NULL,
    descripcion text NOT NULL,
    precio numeric(10,2) NOT NULL,
    imagen text NOT NULL,
    stock integer DEFAULT 0 NOT NULL,
    "stockMin" integer DEFAULT 4 NOT NULL,
    disponible boolean DEFAULT true NOT NULL,
    "creadoEn" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: Producto_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."Producto_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: Producto_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."Producto_id_seq" OWNED BY public."Producto".id;


--
-- Name: Usuario; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Usuario" (
    id integer NOT NULL,
    usuario text NOT NULL,
    nombre text NOT NULL,
    apellidos text NOT NULL,
    password text NOT NULL,
    rol public."Rol" DEFAULT 'CAJERO'::public."Rol" NOT NULL,
    activo boolean DEFAULT true NOT NULL,
    "creadoEn" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: Usuario_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."Usuario_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: Usuario_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."Usuario_id_seq" OWNED BY public."Usuario".id;


--
-- Name: Auditoria id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Auditoria" ALTER COLUMN id SET DEFAULT nextval('public."Auditoria_id_seq"'::regclass);


--
-- Name: Categoria id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Categoria" ALTER COLUMN id SET DEFAULT nextval('public."Categoria_id_seq"'::regclass);


--
-- Name: Pedido id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Pedido" ALTER COLUMN id SET DEFAULT nextval('public."Pedido_id_seq"'::regclass);


--
-- Name: PedidoItem id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."PedidoItem" ALTER COLUMN id SET DEFAULT nextval('public."PedidoItem_id_seq"'::regclass);


--
-- Name: Producto id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Producto" ALTER COLUMN id SET DEFAULT nextval('public."Producto_id_seq"'::regclass);


--
-- Name: Usuario id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Usuario" ALTER COLUMN id SET DEFAULT nextval('public."Usuario_id_seq"'::regclass);


--
-- Data for Name: Auditoria; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Auditoria" (id, "usuarioId", "usuarioNombre", "pedidoId", accion, justificacion, detalle, "creadoEn") FROM stdin;
8	2	cajero1	12	CREADO	\N	{"nota": "Pedido recibido por QR"}	2026-10-18 20:36:35.563
9	\N	Sistema	13	VENCIDO	Anulación automática por vencimiento (40 min).	\N	2026-10-18 20:52:06.577
10	\N	Sistema	12	VENCIDO	Anulación automática por vencimiento (40 min).	\N	2026-10-18 22:12:47.293
11	2	Jessica Mamani Ríos	17	PAGADO	\N	{"total": 38, "servicio": "EN_LOCAL", "metodoPago": "EFECTIVO"}	2026-10-18 22:14:31.612
12	2	Jessica Mamani Ríos	18	CREADO	Pedido manual tomado en mostrador	{"total": 224, "numero": "P-0018"}	2026-10-18 22:15:30.256
13	2	Jessica Mamani Ríos	19	PAGADO	\N	{"total": 38, "servicio": "EN_LOCAL", "metodoPago": "QR"}	2026-10-18 22:33:08.631
14	2	Jessica Mamani Ríos	23	CREADO	Pedido manual tomado en mostrador	{"total": 14, "numero": "P-0023"}	2026-10-18 22:52:08.124
15	\N	Sistema	18	VENCIDO	Anulación automática por vencimiento (40 min).	\N	2026-10-18 22:55:30.893
16	2	Jessica Mamani Ríos	24	CREADO	Pedido manual tomado en mostrador	{"total": 38, "numero": "P-0024"}	2026-10-18 22:59:02.585
17	2	Jessica Mamani Ríos	25	CREADO	Pedido manual tomado en mostrador	{"total": 156, "numero": "P-0025"}	2026-10-18 22:59:52.616
18	2	Jessica Mamani Ríos	25	PAGADO	\N	{"total": 156, "servicio": "EN_LOCAL", "metodoPago": "EFECTIVO"}	2026-10-18 23:00:19.816
19	2	Jessica Mamani Ríos	22	PAGADO	\N	{"total": 46, "servicio": "EN_LOCAL", "metodoPago": "EFECTIVO"}	2026-10-18 23:03:54.597
20	2	Jessica Mamani Ríos	24	PAGADO	\N	{"total": 38, "servicio": "EN_LOCAL", "metodoPago": "EFECTIVO"}	2026-10-18 23:04:51.095
21	2	Jessica Mamani Ríos	26	PAGADO	\N	{"total": 192, "servicio": "EN_LOCAL", "metodoPago": "EFECTIVO"}	2026-10-18 23:11:37.156
22	\N	Sistema	20	VENCIDO	Anulación automática por vencimiento (40 min).	\N	2026-10-18 23:14:31.898
23	\N	Sistema	21	VENCIDO	Anulación automática por vencimiento (40 min).	\N	2026-10-18 23:15:20.119
\.


--
-- Data for Name: Categoria; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Categoria" (id, nombre, tipo, orden, activa) FROM stdin;
7	Platos	PLATOS	1	t
8	Bebidas	BEBIDAS	2	t
9	Postres	POSTRES	3	t
\.


--
-- Data for Name: Pedido; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Pedido" (id, alias, celular, mensaje, estado, servicio, "metodoPago", "montoRecibido", vuelto, total, "validoHasta", "anuladoEn", "motivoAnulacion", "creadoEn", "pagadoEn", "creadoPorId", codigo) FROM stdin;
14	Mesa 4 — Familia Cruz	73022334		PAGADO	EN_LOCAL	EFECTIVO	200.00	22.00	178.00	2026-10-18 20:26:35.554	\N	\N	2026-10-18 19:46:35.554	2026-10-18 20:21:35.554	2	3BB13
15	Diana L.	78455667		PAGADO	EN_LOCAL	QR	\N	\N	46.00	2026-10-18 19:16:35.557	\N	\N	2026-10-18 18:36:35.557	2026-10-18 18:58:35.557	2	25708
16	Sin nombre			ANULADO	EN_LOCAL	\N	\N	\N	22.00	2026-10-18 20:21:35.56	2026-10-18 20:21:35.56	Automático: no se verificó el pedido dentro del plazo de 40 minutos.	2026-10-18 19:41:35.56	\N	\N	9EE16
13	Kevin V.	67788990	Llevar en envases separados.	ANULADO	PARA_LLEVAR	\N	\N	\N	52.00	2026-10-18 20:51:35.552	2026-10-18 20:52:06.571	Automático: el pedido no se presentó a caja dentro de los 40 minutos de validez.	2026-10-18 20:11:35.552	\N	\N	B8127
12	Fernanda Q.	70012345	Sin ají en el colita, por favor.	ANULADO	EN_LOCAL	\N	\N	\N	76.00	2026-10-18 21:04:35.544	2026-10-18 22:12:47.287	Automático: el pedido no se presentó a caja dentro de los 40 minutos de validez.	2026-10-18 20:24:35.544	\N	\N	F1E96
17	oscar	71572401	ddd	PAGADO	EN_LOCAL	EFECTIVO	50.00	12.00	38.00	2026-10-18 22:52:47.312	\N	\N	2026-10-18 22:12:47.315	2026-10-18 22:14:31.605	\N	89B33
19	Pendiente			PAGADO	EN_LOCAL	QR	\N	\N	38.00	2026-10-18 23:13:05.565	\N	\N	2026-10-18 22:33:05.567	2026-10-18 22:33:08.623	\N	20CFA
23	Mostrador			LISTO	EN_LOCAL	\N	\N	\N	14.00	2026-10-18 23:32:08.106	\N	\N	2026-10-18 22:52:08.109	\N	2	FLTRA
18	gg	34534		ANULADO	EN_LOCAL	\N	\N	\N	224.00	2026-10-18 22:55:30.238	2026-10-18 22:55:30.888	Automático: el pedido no se presentó a caja dentro de los 40 minutos de validez.	2026-10-18 22:15:30.239	\N	2	B8658
25	Mostrador			PAGADO	EN_LOCAL	EFECTIVO	200.00	44.00	156.00	2026-10-18 23:39:52.602	\N	\N	2026-10-18 22:59:52.604	2026-10-18 23:00:19.809	2	J5KTK
22	Cliente Demo	72904512	\N	PAGADO	EN_LOCAL	EFECTIVO	50.00	4.00	46.00	2026-10-18 23:26:17.069	\N	\N	2026-10-18 22:46:17.071	2026-10-18 23:03:54.59	\N	XR3B8
24	Mostrador			PAGADO	EN_LOCAL	EFECTIVO	40.00	2.00	38.00	2026-10-18 23:39:02.574	\N	\N	2026-10-18 22:59:02.576	2026-10-18 23:04:51.088	2	8712V
26	43edfsdf	71572401	\N	PAGADO	EN_LOCAL	EFECTIVO	200.00	8.00	192.00	2026-10-18 23:49:47.417	\N	\N	2026-10-18 23:09:47.419	2026-10-18 23:11:37.151	\N	EUJ8B
20	Pendiente			ANULADO	EN_LOCAL	\N	\N	\N	578.00	2026-10-18 23:14:26.854	2026-10-18 23:14:31.894	Automático: el pedido no se presentó a caja dentro de los 40 minutos de validez.	2026-10-18 22:34:26.856	\N	\N	3AADE
21	oscar	71572401	assss	ANULADO	EN_LOCAL	\N	\N	\N	128.00	2026-10-18 23:15:14.153	2026-10-18 23:15:20.115	Automático: el pedido no se presentó a caja dentro de los 40 minutos de validez.	2026-10-18 22:35:14.154	\N	\N	C35E3
27	Pendiente			REGISTRADO	EN_LOCAL	\N	\N	\N	64.00	2026-10-19 00:03:26.642	\N	\N	2026-10-18 23:23:26.643	\N	\N	CJ4KH
\.


--
-- Data for Name: PedidoItem; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."PedidoItem" (id, "pedidoId", "productoId", nombre, tipo, precio, cantidad) FROM stdin;
23	12	44	Picante de Pollo	PLATOS	32.00	2
24	12	49	Mocochinchi Artesanal	BEBIDAS	8.00	2
25	13	47	Churrasco Montero	PLATOS	52.00	1
26	14	42	Pique Macho (2 pers.)	PLATOS	68.00	1
27	14	41	Silpancho a la Chuquisaqueña	PLATOS	38.00	2
28	14	53	Cerveza Paceña	BEBIDAS	14.00	2
29	14	56	Buñuelo con Helado	POSTRES	12.00	2
30	15	46	Majadito Camba	PLATOS	34.00	1
31	15	51	Jugo de Naranja (500 ml)	BEBIDAS	12.00	1
32	16	43	Sopa de Maní	PLATOS	22.00	1
33	17	41	Silpancho a la Chuquisaqueña	PLATOS	38.00	1
34	18	41	Silpancho a la Chuquisaqueña	PLATOS	38.00	1
35	18	43	Sopa de Maní	PLATOS	22.00	1
36	18	45	Fricasé Paceño	PLATOS	30.00	1
37	18	46	Majadito Camba	PLATOS	34.00	1
38	18	44	Picante de Pollo	PLATOS	32.00	1
39	18	42	Pique Macho (2 pers.)	PLATOS	68.00	1
40	19	41	Silpancho a la Chuquisaqueña	PLATOS	38.00	1
41	20	41	Silpancho a la Chuquisaqueña	PLATOS	38.00	2
42	20	42	Pique Macho (2 pers.)	PLATOS	68.00	2
43	20	46	Majadito Camba	PLATOS	34.00	2
44	20	47	Churrasco Montero	PLATOS	52.00	4
45	20	48	Milanesa con Batido (2 pers.)	PLATOS	45.00	2
46	21	41	Silpancho a la Chuquisaqueña	PLATOS	38.00	1
47	21	42	Pique Macho (2 pers.)	PLATOS	68.00	1
48	21	43	Sopa de Maní	PLATOS	22.00	1
49	22	41	Silpancho a la Chuquisaqueña	PLATOS	38.00	1
50	22	49	Mocochinchi Artesanal	BEBIDAS	8.00	1
51	23	53	Cerveza Paceña	BEBIDAS	14.00	1
52	24	41	Silpancho a la Chuquisaqueña	PLATOS	38.00	1
53	25	41	Silpancho a la Chuquisaqueña	PLATOS	38.00	1
54	25	43	Sopa de Maní	PLATOS	22.00	1
55	25	45	Fricasé Paceño	PLATOS	30.00	1
56	25	46	Majadito Camba	PLATOS	34.00	1
57	25	44	Picante de Pollo	PLATOS	32.00	1
58	26	41	Silpancho a la Chuquisaqueña	PLATOS	38.00	1
59	26	42	Pique Macho (2 pers.)	PLATOS	68.00	1
60	26	43	Sopa de Maní	PLATOS	22.00	1
61	26	46	Majadito Camba	PLATOS	34.00	1
62	26	45	Fricasé Paceño	PLATOS	30.00	1
63	27	41	Silpancho a la Chuquisaqueña	PLATOS	38.00	1
64	27	49	Mocochinchi Artesanal	BEBIDAS	8.00	2
65	27	55	Cocada Tradicional	POSTRES	10.00	1
\.


--
-- Data for Name: Producto; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Producto" (id, "categoriaId", nombre, descripcion, precio, imagen, stock, "stockMin", disponible, "creadoEn") FROM stdin;
41	7	Silpancho a la Chuquisaqueña	Milanesa de res, arroz, papas fritas, ensalada fresca y huevo frito.	38.00	emoji:🍛	17	4	t	2026-10-18 20:36:35.526
49	8	Mocochinchi Artesanal	Refresco helado de mocochinchi con canela.	8.00	emoji:🍑	39	4	t	2026-10-18 20:36:35.536
55	9	Cocada Tradicional	Cocada criolla con coco, dulce y fría.	10.00	emoji:🥥	2	5	t	2026-10-18 20:36:35.541
53	8	Cerveza Paceña	Botellín frío.	14.00	emoji:🍺	35	4	t	2026-10-18 20:36:35.539
44	7	Picante de Pollo	Pollo guisado en ají colorado, papa sarnita, arroz y ensalada.	32.00	emoji:🌶️	19	4	t	2026-10-18 20:36:35.531
45	7	Fricasé Paceño	Lechón de cerdo, choclo, mote y ensalada (fin de semana).	30.00	emoji:🍖	0	4	t	2026-10-18 20:36:35.532
46	7	Majadito Camba	Arroz con charque, mandioca frita y huevo frito.	34.00	emoji:🍚	10	4	t	2026-10-18 20:36:35.533
47	7	Churrasco Montero	Filete de res a la parrilla, papas, ensalada y aguacate.	52.00	emoji:🥩	17	4	t	2026-10-18 20:36:35.534
48	7	Milanesa con Batido (2 pers.)	Doble milanesa casera, ensalada rusa y arroz.	45.00	emoji:🥪	10	4	t	2026-10-18 20:36:35.535
42	7	Pique Macho (2 pers.)	Res, chorizos, papas, locoto y cebolla con brotes de mostaza.	68.00	emoji:🍟	14	4	t	2026-10-18 20:36:35.528
43	7	Sopa de Maní	Clásica sopa paceña con costilla, mandioca y papas.	22.00	emoji:🥣	28	4	t	2026-10-18 20:36:35.529
50	8	Refresco de Chicha (jarra)	Chicha helada con canela, la receta de la casa.	7.00	emoji:🧃	25	4	t	2026-10-18 20:36:35.537
51	8	Jugo de Naranja (500 ml)	Natural, recién exprimido.	10.00	emoji:🍊	3	5	t	2026-10-18 20:36:35.538
52	8	Coca-Cola 600 ml	Botella fría.	10.00	emoji:🥤	48	4	t	2026-10-18 20:36:35.539
54	8	Agua Minevi (600 ml)	Botella fresca.	5.00	emoji:💧	60	4	t	2026-10-18 20:36:35.54
56	9	Buñuelo con Helado	Buñuelo casero con helado de vainilla y dulce de leche.	12.00	emoji:🍩	20	4	t	2026-10-18 20:36:35.542
57	9	Tarta de Nuez	Porción con base crocante y caramelo.	18.00	emoji:🥧	8	4	t	2026-10-18 20:36:35.543
58	9	Suspiro de Merengue	Bocadito crujiente de merengue con pasas.	9.00	emoji:🍬	30	4	t	2026-10-18 20:36:35.543
59	9	Gelatina de Fresa	Gelatina natural de fresa con nata.	6.00	emoji:🍮	0	4	f	2026-10-18 20:36:35.544
\.


--
-- Data for Name: Usuario; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Usuario" (id, usuario, nombre, apellidos, password, rol, activo, "creadoEn") FROM stdin;
1	admin	Gerencia	La Paila	$2b$10$wNy7u4nf/hgGJyxobK9g5uTRr5./ii2FpJ2BY7cgIWAPUpnR..sYG	ADMIN	t	2026-10-18 20:03:31.686
2	cajero1	Jessica	Mamani Ríos	$2b$10$kuFzXKDAnfSmESfKs7PQa.iPJ5Zr4vx3b0PyxrQKOOdQSLixlmwIu	CAJERO	t	2026-10-18 20:03:32.046
3	cajero2	Rolando	Torrez Salas	$2b$10$k2MTu8HoTstakpQUQgt64.Aukb9tb29OOSBMG1cKDlz.BHJr5mEee	CAJERO	t	2026-10-18 20:03:32.133
4	cajero3	Lucia	Quispe Vaca	$2b$10$o5Xf8.lh/7tNOI/yOegRs.YrBS0OTM.zOxXtsWseSs7NcwNm.qS3C	CAJERO	t	2026-10-18 20:29:33.612
\.


--
-- Name: Auditoria_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public."Auditoria_id_seq"', 23, true);


--
-- Name: Categoria_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public."Categoria_id_seq"', 9, true);


--
-- Name: PedidoItem_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public."PedidoItem_id_seq"', 65, true);


--
-- Name: Pedido_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public."Pedido_id_seq"', 27, true);


--
-- Name: Producto_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public."Producto_id_seq"', 59, true);


--
-- Name: Usuario_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public."Usuario_id_seq"', 4, true);


--
-- Name: Auditoria Auditoria_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Auditoria"
    ADD CONSTRAINT "Auditoria_pkey" PRIMARY KEY (id);


--
-- Name: Categoria Categoria_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Categoria"
    ADD CONSTRAINT "Categoria_pkey" PRIMARY KEY (id);


--
-- Name: PedidoItem PedidoItem_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."PedidoItem"
    ADD CONSTRAINT "PedidoItem_pkey" PRIMARY KEY (id);


--
-- Name: Pedido Pedido_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Pedido"
    ADD CONSTRAINT "Pedido_pkey" PRIMARY KEY (id);


--
-- Name: Producto Producto_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Producto"
    ADD CONSTRAINT "Producto_pkey" PRIMARY KEY (id);


--
-- Name: Usuario Usuario_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Usuario"
    ADD CONSTRAINT "Usuario_pkey" PRIMARY KEY (id);


--
-- Name: Auditoria_creadoEn_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Auditoria_creadoEn_idx" ON public."Auditoria" USING btree ("creadoEn");


--
-- Name: Categoria_nombre_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "Categoria_nombre_key" ON public."Categoria" USING btree (nombre);


--
-- Name: PedidoItem_pedidoId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "PedidoItem_pedidoId_idx" ON public."PedidoItem" USING btree ("pedidoId");


--
-- Name: Pedido_celular_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Pedido_celular_idx" ON public."Pedido" USING btree (celular);


--
-- Name: Pedido_codigo_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "Pedido_codigo_key" ON public."Pedido" USING btree (codigo);


--
-- Name: Pedido_creadoEn_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Pedido_creadoEn_idx" ON public."Pedido" USING btree ("creadoEn");


--
-- Name: Pedido_estado_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Pedido_estado_idx" ON public."Pedido" USING btree (estado);


--
-- Name: Producto_categoriaId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Producto_categoriaId_idx" ON public."Producto" USING btree ("categoriaId");


--
-- Name: Producto_nombre_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "Producto_nombre_key" ON public."Producto" USING btree (nombre);


--
-- Name: Usuario_usuario_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "Usuario_usuario_key" ON public."Usuario" USING btree (usuario);


--
-- Name: Auditoria Auditoria_pedidoId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Auditoria"
    ADD CONSTRAINT "Auditoria_pedidoId_fkey" FOREIGN KEY ("pedidoId") REFERENCES public."Pedido"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Auditoria Auditoria_usuarioId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Auditoria"
    ADD CONSTRAINT "Auditoria_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES public."Usuario"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: PedidoItem PedidoItem_pedidoId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."PedidoItem"
    ADD CONSTRAINT "PedidoItem_pedidoId_fkey" FOREIGN KEY ("pedidoId") REFERENCES public."Pedido"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: PedidoItem PedidoItem_productoId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."PedidoItem"
    ADD CONSTRAINT "PedidoItem_productoId_fkey" FOREIGN KEY ("productoId") REFERENCES public."Producto"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Pedido Pedido_creadoPorId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Pedido"
    ADD CONSTRAINT "Pedido_creadoPorId_fkey" FOREIGN KEY ("creadoPorId") REFERENCES public."Usuario"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Producto Producto_categoriaId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Producto"
    ADD CONSTRAINT "Producto_categoriaId_fkey" FOREIGN KEY ("categoriaId") REFERENCES public."Categoria"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- PostgreSQL database dump complete
--

\unrestrict UpeRYEHFpY4TQDDE5BYmD5Wl8wX5Ckaq4dihqrnIXLeO0Jfdw8CfA9bnEu6Iv1W

