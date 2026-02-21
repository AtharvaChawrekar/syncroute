import type { Metadata } from "next";
import { Poppins, Bebas_Neue } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "react-hot-toast";
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

        {/*
          Global Toaster — placed AFTER ThemeProvider/children so it is the
          last element appended to <body>. This guarantees it paints above
          every Radix UI portal (Dialog overlays, Dropdowns, etc.) regardless
          of those portals' z-index values, because DOM paint order wins when
          stacking contexts have equal z-index.
        */}
        <Toaster
          position="top-center"
          containerStyle={{ zIndex: 999999 }}
          toastOptions={{
            style: {
              background: "#1a1a1a",
              color: "#f3f4f6",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "14px",
              fontSize: "13px",
              fontWeight: 500,
              backdropFilter: "blur(12px)",
            },
            success: { iconTheme: { primary: "#3b82f6", secondary: "#fff" } },
            error: { iconTheme: { primary: "#ef4444", secondary: "#fff" } },
          }}
        />
      </body>
    </html>
  );
}
