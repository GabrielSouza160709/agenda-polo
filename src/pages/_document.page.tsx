import { Head, Html, Main, NextScript } from 'next/document'

export default function Document() {
  return (
    <Html lang="pt-br">
      <Head>
        <script
          // biome-ignore lint/security/noDangerouslySetInnerHtml: Theme bootstrap must run before hydration to avoid FOUC.
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('polo-agenda-theme');
                  if (!theme) {
                    theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
                  }
                  document.documentElement.classList.toggle('dark', theme === 'dark');
                } catch (error) {}
              })();
            `,
          }}
        />
        <meta name="author" content="Agenda da Sala" />
        <meta
          name="description"
          content="Sistema interno de agendamento de sala de reuniao da Polo Negocios Imobiliarios"
        />
        <meta name="theme-color" content="#F97316" />
        <link rel="icon" href="/logo-polo.png" />
        <meta name="robots" content="noindex, nofollow" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin=""
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  )
}
