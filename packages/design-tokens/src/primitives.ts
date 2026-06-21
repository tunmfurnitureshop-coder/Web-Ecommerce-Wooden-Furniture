export const primitiveColors = {
  white: '#FFFFFF',

  stone50: '#FAF8F5',
  stone100: '#F4F1EC',
  stone200: '#E8E1D8',
  stone300: '#D5CBC0',
  stone400: '#B5AAA0',
  stone500: '#8B8177',
  stone600: '#6C635B',
  stone700: '#4B453F',
  stone800: '#332F2B',
  stone900: '#24201D',

  oak50: '#FFF7E8',
  oak100: '#FBEBCB',
  oak200: '#F1D59C',
  oak300: '#E0BB67',
  oak400: '#C99F42',
  oak500: '#B88E2F',
  oak600: '#946E22',
  oak700: '#74531A',

  success50: '#EAF7EF',
  success500: '#2F7D57',
  success700: '#1E5B3D',

  warning50: '#FFF6DD',
  warning500: '#B7791F',

  danger50: '#FFF0F0',
  danger500: '#C23B3B',

  info50: '#EEF5FF',
  info500: '#3973C6',
} as const;

export type PrimitiveColorKey = keyof typeof primitiveColors;
