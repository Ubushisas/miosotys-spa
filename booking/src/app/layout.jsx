import "./globals.css";

export const metadata = {
  title: "Miosotys Spa - Reservas",
  description: "Sistema de reservas para Miosotys Spa",
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
