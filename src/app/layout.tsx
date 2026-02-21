import type { Metadata } from "next";
import { Poppins, Bebas_Neue } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import "./globals.css";

const poppins = Poppins({
  variable: "--font-poppins",
  weight: ["300", "400", "500", "600", "700"],
  subsets: ["latin"],
});

const bebasNeue = Bebas_Neue({
  variable: "--font-bebas-neue",
  weight: "400",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SyncRoute",
  description: "Plan your unforgettable adventures with SyncRoute.",
};

const scrollbarStyles = `
  ::-webkit-scrollbar { width: 4px; height: 4px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: rgba(100,116,139,0.3); border-radius: 999px; transition: background 0.25s; }
  ::-webkit-scrollbar-thumb:hover { background: rgba(59,130,246,0.55); }
  .dark ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.12); }
  .dark ::-webkit-scrollbar-thumb:hover { background: rgba(59,130,246,0.5); }
  * { scrollbar-width: thin; scrollbar-color: rgba(100,116,139,0.25) transparent; }
  .dark * { scrollbar-color: rgba(255,255,255,0.1) transparent; }
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth" suppressHydrationWarning>
      <head>
        <style dangerouslySetInnerHTML={{ __html: scrollbarStyles }} />
      </head>
      <body
        className={`${poppins.variable} ${bebasNeue.variable} font-sans antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
