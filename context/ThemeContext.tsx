import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from "react";

import { useAppStore } from "../store/useAppStore";
import { setActiveThemeColors } from "../utils/themeBridge";
import {
  DEFAULT_THEME_ID,
  getTheme,
  THEME_ORDER,
  type AppTheme,
  type AppThemeId,
} from "../utils/themes";
import { radii, spacing } from "../utils/designTokens";

const THEME_STORAGE_KEY = "dayos:theme";

interface ThemeContextValue {
  theme: AppTheme;
  themeId: AppThemeId;
  setThemeId: (id: AppThemeId) => void;
  themeOrder: AppThemeId[];
  radii: typeof radii;
  spacing: typeof spacing;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: PropsWithChildren) {
  const storeTheme = useAppStore((s) => s.appPreferences.theme);
  const updateAppPreferences = useAppStore((s) => s.updateAppPreferences);
  const [themeId, setThemeIdState] = useState<AppThemeId>(
    storeTheme ?? DEFAULT_THEME_ID
  );

  useEffect(() => {
    if (storeTheme && storeTheme !== themeId) {
      setThemeIdState(storeTheme);
    }
  }, [storeTheme, themeId]);

  const theme = useMemo(() => getTheme(themeId), [themeId]);

  useEffect(() => {
    setActiveThemeColors(theme.colors);
  }, [theme]);

  const setThemeId = useCallback(
    (id: AppThemeId) => {
      setThemeIdState(id);
      setActiveThemeColors(getTheme(id).colors);
      updateAppPreferences({ theme: id });
      void AsyncStorage.setItem(THEME_STORAGE_KEY, id);
    },
    [updateAppPreferences]
  );

  useEffect(() => {
    void AsyncStorage.getItem(THEME_STORAGE_KEY).then((stored) => {
      if (stored && THEME_ORDER.includes(stored as AppThemeId)) {
        setThemeIdState(stored as AppThemeId);
        setActiveThemeColors(getTheme(stored as AppThemeId).colors);
        if (!storeTheme) {
          updateAppPreferences({ theme: stored as AppThemeId });
        }
      }
    });
  }, [storeTheme, updateAppPreferences]);

  const value = useMemo(
    () => ({
      theme,
      themeId,
      setThemeId,
      themeOrder: THEME_ORDER,
      radii,
      spacing,
    }),
    [theme, themeId, setThemeId]
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return ctx;
}

export function useThemeOptional(): ThemeContextValue | null {
  return useContext(ThemeContext);
}
