import type { Metadata } from "next";
import "./globals.css"; // <--- ASEGURATE QUE ESTA LÍNEA ESTÉ ASÍ

export const metadata: Metadata = {
  title: "Simulador Mundial 2026",
  description: "Montecarlo Pro Analysis",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}