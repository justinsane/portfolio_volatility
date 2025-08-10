import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang='en'>
      <Head>
        {/* Favicon Configuration */}
        <link rel='icon' type='image/x-icon' href='/favicon.ico' />
        <link
          rel='icon'
          type='image/png'
          sizes='16x16'
          href='/favicon-16x16.png'
        />
        <link
          rel='icon'
          type='image/png'
          sizes='32x32'
          href='/favicon-32x32.png'
        />

        {/* Apple Touch Icon */}
        <link
          rel='apple-touch-icon'
          sizes='180x180'
          href='/apple-touch-icon.png'
        />

        {/* Android Chrome Icons */}
        <link
          rel='icon'
          type='image/png'
          sizes='192x192'
          href='/android-chrome-192x192.png'
        />
        <link
          rel='icon'
          type='image/png'
          sizes='512x512'
          href='/android-chrome-512x512.png'
        />

        {/* Web App Manifest */}
        <link rel='manifest' href='/site.webmanifest' />

        {/* Theme Color for Mobile Browsers */}
        <meta name='theme-color' content='#3b82f6' />

        {/* Additional Meta Tags */}
        <meta
          name='application-name'
          content='Portfolio Volatility Predictor'
        />
        <meta name='apple-mobile-web-app-capable' content='yes' />
        <meta name='apple-mobile-web-app-status-bar-style' content='default' />
        <meta
          name='apple-mobile-web-app-title'
          content='Portfolio Volatility Predictor'
        />
        <meta name='format-detection' content='telephone=no' />
        <meta name='mobile-web-app-capable' content='yes' />
        <meta name='msapplication-config' content='/browserconfig.xml' />
        <meta name='msapplication-TileColor' content='#3b82f6' />
        <meta name='msapplication-tap-highlight' content='no' />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
