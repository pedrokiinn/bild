import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { MainLayout } from '@/components/layout/main-layout';
import { GoogleOAuthProvider } from '@react-oauth/google';

export const metadata: Metadata = {
  title: 'G3 Checklist',
  description: 'Gerencie seus veículos com facilidade.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Source+Code+Pro&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-body antialiased h-full">
        {/* Envolvemos a aplicação com o Provider do Google usando o ID das suas credenciais */}
        <GoogleOAuthProvider clientId="886519139268-51t1n7unio8g695g79jch5o53jmjepcl.apps.googleusercontent.com">
          <MainLayout>{children}</MainLayout>
          <Toaster />
        </GoogleOAuthProvider>
      </body>
    </html>
  );
}