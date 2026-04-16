import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "../globals.css";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { BackgroundOrbs } from "@/components/liquid-glass/background-orbs";

const inter = Inter({
    subsets: ["latin"],
    variable: "--font-sans",
    display: "swap",
});

export const metadata: Metadata = {
    title: "DigiHR+ – Employee Self Service",
    description: "Akses layanan HR Anda: slip gaji, absensi, cuti, klaim, dan lainnya.",
    manifest: "/manifest.json",
    appleWebApp: {
        capable: true,
        statusBarStyle: "black-translucent",
        title: "DigiHR+",
    },
    other: {
        "mobile-web-app-capable": "yes",
    },
};

export const viewport: Viewport = {
    themeColor: "#007aff",
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
};

export default function EssLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="id" suppressHydrationWarning>
            <head>
                <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
            </head>
            <body className={`${inter.variable} antialiased bg-background text-foreground`} style={{ margin: 0, padding: 0 }}>
                <ThemeProvider
                    attribute="class"
                    defaultTheme="dark"
                    enableSystem
                    disableTransitionOnChange={false}
                >
                    <div className="relative min-h-[100dvh] bg-black sm:bg-black/95 flex justify-center items-start overflow-hidden ess-pwa">
                        {/* Desktop Ambient Background */}
                        <div className="absolute inset-0 pointer-events-none hidden sm:block opacity-60">
                            <BackgroundOrbs />
                        </div>

                        {/* Mobile Application Frame */}
                        <div className="relative z-10 w-full max-w-[480px] min-h-[100dvh] bg-[var(--ios-system-bg)] overflow-x-hidden shadow-2xl sm:border-x sm:border-white/10 flex flex-col">
                            {children}
                        </div>
                    </div>
                </ThemeProvider>
            </body>
        </html>
    );
}

