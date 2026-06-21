export const layout = {
  container: {
    maxWidth: '1280px',
    desktopGutter: '48px',
    tabletGutter: '32px',
    mobileGutter: '16px',
  },

  grid: {
    desktopColumns: 12,
    productGridGap: '24px',
    sectionGap: '64px',
  },

  breakpoints: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1440px',
  },
} as const;

export const WEB_LAYOUT = {
  desktopHeaderHeight: 80,
  mobileHeaderHeight: 64,
  cartDrawerWidth: 460,
  productGridDesktopColumns: 4,
  productGridTabletColumns: 3,
} as const;
