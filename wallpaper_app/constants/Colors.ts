/**
 * Wallpaper App Color Scheme - Orange and Black Theme
 */

const primaryOrange = '#FF6B35';
const secondaryOrange = '#FF8C42';
const darkOrange = '#E55A2B';
const lightOrange = '#FFB892';

const primaryBlack = '#1A1A1A';
const secondaryBlack = '#2A2A2A';
const lightBlack = '#3A3A3A';

export const Colors = {
  light: {
    text: primaryBlack,
    background: '#FFFFFF',
    card: '#F8F8F8',
    tint: primaryOrange,
    icon: lightBlack,
    tabIconDefault: lightBlack,
    tabIconSelected: primaryOrange,
    primary: primaryOrange,
    secondary: secondaryOrange,
    accent: darkOrange,
    border: '#E5E5E5',
    placeholder: '#888888',
  },
  dark: {
    text: '#FFFFFF',
    background: primaryBlack,
    card: secondaryBlack,
    tint: primaryOrange,
    icon: '#CCCCCC',
    tabIconDefault: '#888888',
    tabIconSelected: primaryOrange,
    primary: primaryOrange,
    secondary: secondaryOrange,
    accent: lightOrange,
    border: lightBlack,
    placeholder: '#666666',
  },
};
