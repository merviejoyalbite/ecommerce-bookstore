import { useWindowDimensions } from 'react-native';

// Breakpoints mirror the prototype CSS (700px mobile / 900-1100px tablet).
export function useBreakpoint() {
  const { width } = useWindowDimensions();
  return {
    width,
    small: width < 700,
    medium: width >= 700 && width < 1100,
    large: width >= 1100,
    // Stack two-column layouts below this width.
    stacked: width < 1000,
    // Hide sidebars/drawers below this width.
    compactNav: width < 900,
  };
}
