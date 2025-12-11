import { Html, Head, Main, NextScript } from 'next/document'

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        <title>Discord Clone</title>
        {/* Tailwind CDN for quick setup without build config overhead */}
        <script src="https://cdn.tailwindcss.com"></script>
        <script dangerouslySetInnerHTML={{
          __html: `
            tailwind.config = {
              theme: {
                extend: {
                  colors: {
                    discord: {
                      darkest: '#1e1f22',
                      darker: '#2b2d31',
                      dark: '#313338',
                      light: '#404249',
                      primary: '#5865F2',
                      primaryHover: '#4752C4',
                      text: '#dbdee1',
                      textMuted: '#949ba4'
                    }
                  }
                }
              }
            }
          `
        }} />
        <style>{`
          body {
            background-color: #313338;
            color: #dbdee1;
            font-family: 'gg sans', 'Helvetica Neue', Helvetica, Arial, sans-serif;
          }
          /* Custom Scrollbar */
          ::-webkit-scrollbar {
            width: 8px;
            height: 8px;
            background-color: #2b2d31;
          }
          ::-webkit-scrollbar-thumb {
            background-color: #1a1b1e;
            border-radius: 4px;
          }
          ::-webkit-scrollbar-track {
            background-color: #2b2d31;
          }
        `}</style>
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  )
}