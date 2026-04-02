import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'MySanjeevani Healthcare Platform',
  description: 'Healthcare platform providing medicines and health services',
  icons: {
    icon: '/icon.png?v=4',
    shortcut: '/icon.png?v=4',
    apple: '/icon.png?v=4',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang='en'>
      <head>
        <link rel="icon" href="/icon.png?v=4" sizes="32x32" type="image/png" />
        <link rel="shortcut icon" href="/icon.png?v=4" type="image/png" />
        <link rel="apple-touch-icon" href="/icon.png?v=4" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if (typeof window !== 'undefined') {
                // Prevent "mgt.clearMarks is not a function" error from browser extensions
                if (!window.mgt) window.mgt = {};
                if (typeof window.mgt.clearMarks !== 'function') {
                  window.mgt.clearMarks = function() {};
                }
                if (typeof window.mgt.mark !== 'function') {
                  window.mgt.mark = function() {};
                }
                // Safety guard for performance API if needed
                if (typeof performance !== 'undefined') {
                  if (typeof performance.clearMarks !== 'function') {
                    performance.clearMarks = function() {};
                  }
                  if (typeof performance.mark !== 'function') {
                    performance.mark = function() {};
                  }
                }
              }
            `,
          }}
        />
      </head>
      <body className={inter.className} suppressHydrationWarning>{children}</body>
    </html>
  );
}
