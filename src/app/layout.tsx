import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "La Paila · Picantería criolla",
  description: "Menú digital por QR, caja de pedidos y reportes en línea.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#140e0a",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="fondo-brasa min-h-dvh">{children}</body>
    </html>
  );
}
