import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "sonner";

export const metadata: Metadata = {
  title: "WebGen AI - Buat Website Instan dengan AI",
  description:
    "Generate website profesional dalam 10 detik. Cukup ketik deskripsi, AI buatkan website-nya. Mulai Rp 15.000.",
  keywords: ["ai website generator", "buat website", "website builder", "ai"],
  openGraph: {
    title: "WebGen AI - Buat Website Instan dengan AI",
    description: "Generate website profesional dalam 10 detik dengan AI.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body className="antialiased min-h-screen">
        {children}
        <Toaster position="top-center" richColors />
      </body>
    </html>
  );
}
