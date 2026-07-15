
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
  // Novo Client ID oficial fornecido pelo usuário
  const googleClientId = "886519139268-gkvfik842emuc2m6to5a2i9t98km3e9d.apps.googleusercontent.com";

  return (
    <html lang="pt-BR" className="h-full">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Source+Code+Pro&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-body antialiased h-full">
        <GoogleOAuthProvider clientId={googleClientId}>
          <MainLayout>{children}</MainLayout>
          <Toaster />
        </GoogleOAuthProvider>
      </body>
    </html>
  );
}
