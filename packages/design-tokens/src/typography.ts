export const typography = {
  fontFamily: {
    display: '"DM Serif Display", "Noto Serif SC", Georgia, serif',
    sans: '"Manrope", "Noto Sans SC", system-ui, sans-serif',
  },

  fontSize: {
    xs: '12px',
    sm: '14px',
    base: '16px',
    lg: '18px',
    xl: '20px',
    '2xl': '24px',
    '3xl': '32px',
    '4xl': '40px',
    '5xl': '56px',
  },

  fontWeight: {
    regular: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },

  lineHeight: {
    hero: 1.1,
    heading: 1.2,
    body: 1.5,
    ui: 1.4,
  },
} as const;
