import { Html, Head, Main, NextScript } from 'next/document'

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        <title>Chat App</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <script dangerouslySetInnerHTML={{
          __html: `
            tailwind.config = {
              theme: {
                extend: {
                  colors: {
                    background: '#09090b', // Zinc 950
                    surface: '#18181b',    // Zinc 900
                    surfaceHighlight: '#27272a', // Zinc 800
                    primary: '#6366f1',    // Indigo 500
                    primaryHover: '#4f46e5',
                    text: '#f4f4f5',       // Zinc 100
                    textMuted: '#a1a1aa',  // Zinc 400
                    border: '#27272a',
                  },
                  borderRadius: {
                    'xl': '1rem',
                    '2xl': '1.5rem',
                    '3xl': '2rem',
                  }
                }
              }
            }
          `
        }} />
        <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
        <style>{`
          body {
            background-color: #09090b;
            color: #f4f4f5;
            font-family: 'Plus Jakarta Sans', sans-serif;
            overflow: hidden;
          }
          /* Custom Scrollbar for the new soft look */
          ::-webkit-scrollbar {
            width: 6px;
            height: 6px;
          }
          ::-webkit-scrollbar-thumb {
            background-color: #3f3f46;
            border-radius: 9999px;
          }
          ::-webkit-scrollbar-track {
            background-color: transparent;
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