import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export function useTheme() {
  const scheme = useColorScheme();
  
  // Explicitly fallback to 'light' if scheme is 'unspecified' or null
  const theme: 'light' | 'dark' = (scheme === 'dark') ? 'dark' : 'light';

  return Colors[theme];
}