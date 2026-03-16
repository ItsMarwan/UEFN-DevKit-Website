import type { Config } from 'tailwindcss'
import { siteConfig } from './src/config/site'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          blue: siteConfig.colors.primary,
          cyan: siteConfig.colors.secondary,
        },
      },
      backgroundColor: {
        dark: siteConfig.colors.dark,
        light: siteConfig.colors.light,
      },
      textColor: {
        dark: siteConfig.colors.dark,
        light: siteConfig.colors.light,
      },
    },
  },
  plugins: [],
}
export default config
