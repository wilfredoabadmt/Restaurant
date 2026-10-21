import type { Metadata, Viewport } from "next";
import { Urbanist } from "next/font/google";
import "./globals.css";

/**
 * Tipografía geométrica estilo Gilroy en todos sus cortes y pesos:
 * 300 (Light), 400 (Regular), 500 (Medium), 600 (SemiBold),
 * 700 (Bold), 800 (ExtraBold), 900 (Black) con soporte para cursiva.
 */
const gilroy = Urbanist({
  subsets: ["latin"],
  variable: "--font-gilroy",
  display: "swap",
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: "La Paila · Picantería Criolla",
  description: "Menú digital por QR, caja de pedidos y reportes en línea.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0d0906",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={gilroy.variable}>
      <body className="fondo-brasa min-h-dvh antialiased font-sans">{children}</body>
    </html>
  );
}
