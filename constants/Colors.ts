// File: Colors.ts (or themes.ts)
export type ThemeKey = 'Dark' | 'Sakura' | 'Metal' | 'Light';

export const THEMES: Record<ThemeKey, {
  primary: string;
  secondary: string;
  background: string;
  surface: string;
  text: string;
  onSurface: string;
  error: string;
  card: string;
  border: string;
  notification: string;
  button: string;
  buttonText: string;
}> = {
  Dark: {
    primary: '#00BFFF',
    secondary: '#B0BEC5',
    background: '#121212',
    surface: '#2C2C2C',
    text: '#FAFAFA',
    onSurface: '#E0E0E0',
    error: '#FF5252',
    card: '#242424',
    border: '#3E3E3E',
    notification: '#FF80AB',
    button: '#00E676',
    buttonText: '#FFFFFF',
  },
  Sakura: {
    primary: '#F48FB1',
    /* etc. ... */
    secondary: '#FFEBEE',
    background: '#FFF3F8',
    surface: '#FFE0EC',
    text: '#6A1B1A',
    onSurface: '#8D6E63',
    error: '#FF5252',
    card: '#FCE4EC',
    border: '#F8BBD0',
    notification: '#FF80AB',
    button: '#F06292',
    buttonText: '#FFFFFF',
  },
  Metal: {
    /* black/white only... */
    primary: '#000000',
    secondary: '#FFFFFF',
    background: '#FFFFFF',
    surface: '#F2F2F2',
    text: '#000000',
    onSurface: '#4D4D4D',
    error: '#000000',
    card: '#FFFFFF',
    border: '#000000',
    notification: '#000000',
    button: '#000000',
    buttonText: '#FFFFFF',
  },
  Light: {
    primary: '#2196F3',
    secondary: '#B0BEC5',
    background: '#FAFAFA',
    surface: '#FFFFFF',
    text: '#121212',
    onSurface: '#757575',
    error: '#FF5252',
    card: '#FFFFFF',
    border: '#E0E0E0',
    notification: '#FF80AB',
    button: '#00E676',
    buttonText: '#FFFFFF',
  },
};

// We can default export if you'd like:
export default THEMES;
