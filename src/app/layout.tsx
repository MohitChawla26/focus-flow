import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "focus-flow — know what needs you first",
  description: "Notices, mail and news ranked by what a student must act on first.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body suppressHydrationWarning className="min-h-full">
        {children}
        <Script id="bitdefender-hydration-guard" strategy="beforeInteractive">
          {`(() => {
            const attribute = "bis_skin_checked";
            const clean = (root) => {
              if (root?.nodeType === Node.ELEMENT_NODE) root.removeAttribute(attribute);
              root?.querySelectorAll?.("[" + attribute + "]").forEach((node) => node.removeAttribute(attribute));
            };
            clean(document);
            new MutationObserver((mutations) => {
              for (const mutation of mutations) {
                if (mutation.type === "attributes") clean(mutation.target);
                mutation.addedNodes.forEach(clean);
              }
            }).observe(document.documentElement, {
              attributeFilter: [attribute],
              attributes: true,
              childList: true,
              subtree: true,
            });
          })();`}
        </Script>
      </body>
    </html>
  );
}
