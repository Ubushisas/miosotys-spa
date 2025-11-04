import "./globals.css";

export const metadata = {
  title: "Miosotys Spa - Reservas",
  description: "Sistema de reservas para Miosotys Spa",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
};

export default function RootLayout({ children }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
