/**
 * ThemeProvider — switchable light / dark / system theme.
 *
 * Usage:
 *   const { colors, themeMode, setThemeMode, colorScheme } = useTheme();
 *
 * Components can read `colors.background`, `colors.text`, etc.
 * NativeWind's `dark:` prefix is automatically driven by the device
 * colour scheme or manual override via setThemeMode().
 */
import React, {
    createContext,
    useCallback,
    useContext,
    useMemo,
    useState,
} from 'react';
import { useColorScheme } from 'react-native';
import { Colors, DarkColors } from '../lib/design';

export type ThemeMode = 'light' | 'dark' | 'system';
export type ColorScheme = 'light' | 'dark';

type ThemeColors = typeof Colors;

interface ThemeContextValue {
  themeMode: ThemeMode;
  colorScheme: ColorScheme;
  setThemeMode: (mode: ThemeMode) => void;
  isDark: boolean;
  colors: ThemeColors;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export const useTheme = (): ThemeContextValue => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
};

interface ThemeProviderProps {
  children: React.ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({children}) => {
  const systemScheme = useColorScheme() ?? 'light';
  const [themeMode, setThemeModeState] = useState<ThemeMode>('system');

  const setThemeMode = useCallback((mode: ThemeMode) => {
    setThemeModeState(mode);
  }, []);

  const colorScheme: ColorScheme =
    themeMode === 'system' ? systemScheme : themeMode;

  const isDark = colorScheme === 'dark';
  const colors = isDark ? (DarkColors as unknown as ThemeColors) : Colors;

  const value = useMemo<ThemeContextValue>(
    () => ({themeMode, colorScheme, setThemeMode, isDark, colors}),
    [themeMode, colorScheme, setThemeMode, isDark, colors],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
};
