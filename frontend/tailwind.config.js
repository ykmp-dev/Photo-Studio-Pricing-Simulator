/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // 濃紺（Deep Navy Blue）- ボタン・見出し用
        navy: {
          50: '#e8eaf6',
          100: '#c5cae9',
          200: '#9fa8da',
          300: '#7986cb',
          400: '#5c6bc0',
          500: '#3f51b5',
          600: '#1a237e', // メインカラー
          700: '#151d5f',
          800: '#0f1640',
          900: '#0a0f29',
        },
        // アイボリー（Ivory）- 背景・カード用
        ivory: {
          50: '#fefefe',
          100: '#fdfcfa',
          200: '#fcf9f4',
          300: '#faf6ed',
          400: '#f9f3e6',
          500: '#f7f0df', // メインカラー
          600: '#f0e8cc',
          700: '#e8dfb9',
          800: '#e0d6a6',
          900: '#d8cd93',
        },
        // プライマリカラー（navy のエイリアス）
        primary: {
          50: '#e8eaf6',
          100: '#c5cae9',
          200: '#9fa8da',
          300: '#7986cb',
          400: '#5c6bc0',
          500: '#3f51b5',
          600: '#1a237e',
          700: '#151d5f',
          800: '#0f1640',
          900: '#0a0f29',
        }
      },
      fontFamily: {
        // 游ゴシック for Japanese
        'yugothic': ['"Yu Gothic"', '"YuGothic"', '"游ゴシック"', 'sans-serif'],
        // Serif for English
        'serif': ['Georgia', 'Cambria', '"Times New Roman"', 'Times', 'serif'],
        // デフォルト
        'sans': ['"Yu Gothic"', '"YuGothic"', '"游ゴシック"', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'japanese-pattern': "url('/patterns/japanese-wave.svg')",
      },
      borderRadius: {
        'sm-japanese': '2px',
        'md-japanese': '4px',
      }
    },
  },
  plugins: [],
}
