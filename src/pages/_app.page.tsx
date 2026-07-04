import { ToastProvider } from '@/components/ui/toast'
import { queryClient } from '@/lib/react-query'
import '@schedule-x/theme-default/dist/index.css'
import '@/styles/globals.css'
import { QueryClientProvider } from '@tanstack/react-query'
import { SessionProvider } from 'next-auth/react'
import { DefaultSeo } from 'next-seo'
import type { AppProps } from 'next/app'
import Head from 'next/head'
import 'temporal-polyfill/global'
import '../lib/dayjs'

export default function App({
  Component,
  pageProps: { session, ...pageProps },
}: AppProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <SessionProvider
        session={session}
        refetchInterval={0}
        refetchOnWindowFocus={false}
      >
        <ToastProvider>
          <Head>
            <meta
              name="viewport"
              content="width=device-width, initial-scale=1"
            />
          </Head>
          <DefaultSeo
            titleTemplate="%s"
            defaultTitle="Agenda de Sala - Polo Negocios"
            description="Sistema interno de agendamento de sala de reuniao da Polo Negocios Imobiliarios"
            dangerouslySetAllPagesToNoIndex
            dangerouslySetAllPagesToNoFollow
            openGraph={{
              type: 'website',
              locale: 'pt_BR',
              siteName: 'Agenda de Sala - Polo Negocios',
              title: 'Agenda de Sala - Polo Negocios',
              description:
                'Sistema interno de agendamento de sala de reuniao da Polo Negocios Imobiliarios',
            }}
            twitter={{
              cardType: 'summary_large_image',
            }}
          />
          <Component {...pageProps} />
        </ToastProvider>
      </SessionProvider>
    </QueryClientProvider>
  )
}
