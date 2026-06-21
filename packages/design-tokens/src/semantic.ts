export const semanticColors = {
  background: 'stone50',
  surface: 'white',
  surfaceMuted: 'stone100',
  surfaceSubtle: 'stone50',

  textPrimary: 'stone900',
  textSecondary: 'stone600',
  textMuted: 'stone500',
  textInverse: 'white',

  borderDefault: 'stone200',
  borderStrong: 'stone300',
  borderFocus: 'oak500',

  brand: 'oak500',
  brandHover: 'oak600',
  brandActive: 'oak700',
  brandSoft: 'oak100',

  success: 'success500',
  successBg: 'success50',
  warning: 'warning500',
  warningBg: 'warning50',
  danger: 'danger500',
  dangerBg: 'danger50',
  info: 'info500',
  infoBg: 'info50',
} as const;

export type SemanticColorKey = keyof typeof semanticColors;
