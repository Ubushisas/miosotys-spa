import "./globals.css";

export const metadata = {
  title: "Myosotis Spa - Reservas",
  description: "Sistema de reservas para Myosotis Spa",
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
