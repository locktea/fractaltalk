// FOSS stub for @rocket.chat/ui-theming
export type ThemeMode = 'light' | 'dark' | 'auto';

export function useThemeMode(): [ThemeMode, (mode: ThemeMode) => void, ThemeMode] {
	const setMode = () => {};
	return ['light', setMode, 'light'];
}

export default {};
