import { useWindowDimensions } from 'react-native';

// Breakpoints mirror the prototype CSS (760px mobile / 1100px tablet).
export function useBreakpoint() {
  const { width } = useWindowDimensions();
  return {
    width,
    small: width < 700,
    medium: width >= 700 && width < 1100,
    large: width >= 1100,
  };
}
