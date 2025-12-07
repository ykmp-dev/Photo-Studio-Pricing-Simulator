/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // 青系（参考サイトのメインカラー）
        blue: {
          50: '#e3f2fd',
          100: '#bbdefb',
          200: '#90caf9',
          300: '#64b5f6',
          400: '#42a5f5',
          500: '#4a6fa5', // メインカラー
          600: '#1e88e5',
          700: '#1976d2',
          800: '#1565c0',
          900: '#0d47a1',
        },
        // 明るいベージュ（背景用）
        ivory: {
          50: '#ffffff',
          100: '#fafafa',
          200: '#f8f8f8',
          300: '#f7f7f7',
          400: '#f6f6f6',
          500: '#f5f5f0', // メインカラー（参考サイトに近い）
          600: '#eeeeee',
          700: '#e0e0e0',
          800: '#bdbdbd',
          900: '#9e9e9e',
        },
        // アクセントカラー（カード枠線用）
        accent: {
          blue: '#4a90e2',
          pink: '#ff6b9d',
          green: '#4caf50',
        },
        // プライマリカラー（blue のエイリアス）
        primary: {
          50: '#e3f2fd',
          100: '#bbdefb',
          200: '#90caf9',
          300: '#64b5f6',
          400: '#42a5f5',
          500: '#4a6fa5',
          600: '#1e88e5',
          700: '#1976d2',
          800: '#1565c0',
          900: '#0d47a1',
        },
        // ネイビー（見出し用）
        navy: {
          50: '#e8eaf6',
          100: '#c5cae9',
          200: '#9fa8da',
          300: '#7986cb',
          400: '#5c6bc0',
          500: '#3f51b5',
          600: '#283593',
          700: '#1a237e',
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
        'sm-japanese': '4px',
        'md-japanese': '8px',
        'lg-japanese': '12px',
      }
    },
  },
  plugins: [],
}
