import { createContext, useContext, useEffect, useMemo, useState } from "react";

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem("gradglow-theme") === "dark";
  });

  useEffect(() => {
    localStorage.setItem("gradglow-theme", darkMode ? "dark" : "light");

    document.body.classList.toggle("dark", darkMode);
    document.documentElement.classList.toggle("dark", darkMode);
  }, [darkMode]);

  const value = useMemo(
    () => ({
      darkMode,
      dark: darkMode,
      setDarkMode,
      toggleTheme: () => setDarkMode((current) => !current),
    }),
    [darkMode]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error("useTheme must be used inside ThemeProvider");
  }

  return context;
}