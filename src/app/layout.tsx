import type { Metadata } from "next";
import { Bowlby_One, Geist, Geist_Mono, Outfit } from "next/font/google";
import Backdrop from "@/components/Backdrop";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const bowlby = Bowlby_One({
  variable: "--font-bowlby",
  weight: "400",
  subsets: ["latin"],
});

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

const title = "Ilusion Bowl | Reporta una falla en tu pista";
const description = "¿Algo falló en tu pista? Cuéntanos qué pasó y lo revisamos. Solo toma un minuto.";

export const metadata: Metadata = {
  // Las imágenes de la vista previa necesitan una dirección absoluta. En Vercel se detecta sola;
  // en otro servicio, define NEXT_PUBLIC_SITE_URL (por ejemplo https://tu-pagina.com).
  metadataBase: process.env.NEXT_PUBLIC_SITE_URL ? new URL(process.env.NEXT_PUBLIC_SITE_URL) : undefined,
  title,
  description,
  applicationName: "Ilusion Bowl",
  openGraph: { title, description, siteName: "Ilusion Bowl", locale: "es_MX", type: "website" },
  twitter: { card: "summary_large_image", title, description },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} ${bowlby.variable} ${outfit.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <Backdrop />
        {children}
      </body>
    </html>
  );
}
