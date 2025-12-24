/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // 横浜そごう写真館のブランドカラー - 上品で洗練されたブルー
        brand: {
          50: '#EBF5FF',   // 非常に淡いブルー（背景用）
          100: '#D6EBFF',  // 淡いブルー
          200: '#A8D5FF',  // 柔らかいブルー
          300: '#7AB8F5',  // 明るいブルー
          400: '#5B8DBE',  // メインブルー（横浜そごう写真館）
          500: '#4A7BA7',  // 標準ブルー
          600: '#3D6690',  // 濃いブルー
          700: '#2C5282',  // ダークブルー
          800: '#1E3A5F',  // 深いブルー
          900: '#0F1F3D',  // 最も濃いブルー
        },
        // プライマリカラー（brandのエイリアス）
        primary: {
          50: '#EBF5FF',
          100: '#D6EBFF',
          200: '#A8D5FF',
          300: '#7AB8F5',
          400: '#5B8DBE',
          500: '#4A7BA7',
          600: '#3D6690',
          700: '#2C5282',
          800: '#1E3A5F',
          900: '#0F1F3D',
        },
        // セカンダリカラー - 温かみのあるゴールド
        secondary: {
          50: '#FFF9E6',
          100: '#FFF3CC',
          200: '#FFE699',
          300: '#FFD966',
          400: '#FFCC33',
          500: '#F5B800',
          600: '#CC9900',
          700: '#997300',
          800: '#664D00',
          900: '#332600',
        },
        // アクセントカラー
        accent: {
          blue: '#5B8DBE',
          gold: '#F5B800',
          rose: '#E8B4B8',
          sage: '#B8C5B8',
        },
        // ニュートラルカラー - より洗練されたグレー
        neutral: {
          50: '#FAFBFC',
          100: '#F4F6F8',
          200: '#E8ECEF',
          300: '#D1D8DD',
          400: '#A0AABA',
          500: '#6B7280',
          600: '#4B5563',
          700: '#374151',
          800: '#1F2937',
          900: '#111827',
        },
        // 背景色 - 柔らかいアイボリー
        background: {
          50: '#FFFFFF',
          100: '#FDFDFB',
          200: '#FAF9F7',
          300: '#F7F6F3',
          400: '#F4F3EF',
          500: '#F0EFE9',  // メイン背景色
          600: '#E8E7E0',
          700: '#D9D8D0',
          800: '#C5C4BC',
          900: '#A8A79F',
        },
      },
      fontFamily: {
        // 筑紫明朝風の明朝体（游明朝、Noto Serif JP）
        'mincho': ['"Yu Mincho"', '"YuMincho"', '"游明朝"', '"Noto Serif JP"', 'Georgia', 'serif'],
        // ゴシック体（サブテキスト用）
        'gothic': ['"Yu Gothic"', '"YuGothic"', '"游ゴシック"', 'sans-serif'],
        // デフォルト（明朝体メイン）
        'sans': ['"Yu Mincho"', '"YuMincho"', '"游明朝"', '"Noto Serif JP"', 'serif'],
      },
      backgroundImage: {
        'dot-pattern': 'radial-gradient(circle, rgba(91, 141, 190, 0.04) 1px, transparent 1px)',
        'grid-pattern': 'linear-gradient(rgba(91, 141, 190, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(91, 141, 190, 0.03) 1px, transparent 1px)',
      },
      backgroundSize: {
        'dot': '20px 20px',
        'grid': '40px 40px',
      },
      borderRadius: {
        'sm-japanese': '4px',
        'md-japanese': '8px',
        'lg-japanese': '12px',
      },
      boxShadow: {
        'soft': '0 2px 8px rgba(0, 0, 0, 0.08)',
        'medium': '0 4px 16px rgba(0, 0, 0, 0.12)',
        'large': '0 8px 32px rgba(0, 0, 0, 0.16)',
        'brand': '0 4px 16px rgba(91, 141, 190, 0.15)',
        'brand-lg': '0 8px 32px rgba(91, 141, 190, 0.2)',
        'inner-soft': 'inset 0 2px 4px rgba(0, 0, 0, 0.06)',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.5s ease-out',
        'slide-down': 'slideDown 0.5s ease-out',
        'scale-in': 'scaleIn 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '100': '25rem',
        '112': '28rem',
        '128': '32rem',
      },
    },
  },
  plugins: [],
}
