import "./globals.css";

export const metadata = {
  title: "Myosotis Spa - Reservas",
  description: "Sistema de reservas para Myosotis Spa",
  icons: {
    icon: '/favicon.png',
    shortcut: '/favicon.png',
    apple: '/favicon.png',
  },
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
