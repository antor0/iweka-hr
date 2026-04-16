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
    title: "MyHRIS – Employee Self Service",
    description: "Akses layanan HR Anda: slip gaji, absensi, cuti, klaim, dan lainnya.",
    manifest: "/manifest.json",
    appleWebApp: {
        capable: true,
        statusBarStyle: "black-translucent",
        title: "MyHRIS",
    },
    other: {
        "mobile-web-app-capable": "yes",
    },
};

export const viewport: Viewport = {
    themeColor: "#6366f1",
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
                    <div className="relative min-h-screen overflow-x-hidden">
                        <BackgroundOrbs />
                        <div className="relative z-10">
                            {children}
                        </div>
                    </div>
                </ThemeProvider>
            </body>
        </html>
    );
}

