import './globals.css';

export const dynamic = 'force-dynamic';

export const metadata = { title: 'SafeLabel AI Admin', description: 'SafeLabel AI administration console' };

export default function RootLayout({ children }) {
  const backendUrl =
    process.env.BACKEND_API_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    'https://safelabel-api-g6cnaah8ardsfpfs.uaenorth-01.azurewebsites.net';

  return (
    <html lang="en">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `window.__BACKEND_API_URL__ = ${JSON.stringify(backendUrl.trim().replace(/\/$/, ''))};`,
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
