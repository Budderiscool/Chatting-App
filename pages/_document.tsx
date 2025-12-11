import { Html, Head, Main, NextScript } from 'next/document'

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        <title>Discord Clone</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <script dangerouslySetInnerHTML={{
          __html: `
            tailwind.config = {
              theme: {
                extend: {
                  colors: {
                    discord: {
                      darkest: '#1E1F22',  // Server list
                      darker: '#2B2D31',   // Channel list & Members
                      dark: '#313338',     // Chat background
                      light: '#404249',    // Hover states
                      input: '#383A40',    // Input background
                      primary: '#5865F2',  // Blurple
                      primaryHover: '#4752C4',
                      green: '#23A559',
                      red: '#DA373C',
                      text: '#F2F3F5',     // Primary text
                      textMuted: '#949BA4', // Secondary text
                      divider: '#1E1F22'
                    }
                  },
                  borderRadius: {
                    'discord': '16px',
                    'discord-small': '4px'
                  }
                }
              }
            }
          `
        }} />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
        <style>{`
          body {
            background-color: #313338;
            color: #F2F3F5;
            font-family: 'Inter', 'Helvetica Neue', Helvetica, Arial, sans-serif;
            overflow: hidden; /* Prevent body scroll */
          }
          /* Custom Scrollbar */
          ::-webkit-scrollbar {
            width: 8px;
            height: 8px;
            background-color: #2B2D31;
          }
          ::-webkit-scrollbar-thumb {
            background-color: #1A1B1E;
            border-radius: 4px;
          }
          ::-webkit-scrollbar-track {
            background-color: #2B2D31;
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