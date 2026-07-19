import { createSlice } from '@reduxjs/toolkit';

export type ThemeMode = 'light' | 'dark';

interface UiState {
  theme: ThemeMode;
}

function readTheme(): ThemeMode {
  const stored = localStorage.getItem('ui.theme');
  if (stored === 'light' || stored === 'dark') {
    return stored;
  }
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

const initialState: UiState = {
  theme: readTheme(),
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    themeToggled(state) {
      state.theme = state.theme === 'light' ? 'dark' : 'light';
      localStorage.setItem('ui.theme', state.theme);
    },
  },
});

export const { themeToggled } = uiSlice.actions;
export default uiSlice.reducer;
