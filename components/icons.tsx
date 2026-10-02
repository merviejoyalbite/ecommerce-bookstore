import Svg, { Circle, Path, Rect } from 'react-native-svg';

// Exact line-icon set from the Figma Make prototype:
// 24×24 viewBox, stroke 1.7, round caps; heart fills when active.
export type IconName =
  | 'book'
  | 'search'
  | 'user'
  | 'bag'
  | 'menu'
  | 'heart'
  | 'star'
  | 'truck'
  | 'shield'
  | 'refresh'
  | 'headphones'
  | 'arrow'
  | 'instagram'
  | 'facebook'
  | 'pinterest'
  | 'package'
  | 'map'
  | 'cart'
  | 'eye'
  | 'eyeOff'
  | 'lock'
  | 'mail'
  | 'check'
  | 'chevron'
  | 'grid'
  | 'list'
  | 'phone'
  | 'cash'
  | 'trash'
  | 'rotate'
  | 'card'
  | 'calendar'
  | 'pin'
  | 'settings'
  | 'logout'
  | 'box'
  | 'download'
  | 'help'
  | 'more'
  | 'users'
  | 'boxes'
  | 'tag'
  | 'chart'
  | 'bell'
  | 'printer'
  | 'copy';

export function Icon({
  name,
  size = 20,
  color = '#251605',
  filled = false,
}: {
  name: IconName;
  size?: number;
  color?: string;
  filled?: boolean;
}) {
  const stroke = {
    stroke: color,
    strokeWidth: 1.7,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  };
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={filled ? color : 'none'} aria-hidden={true}>
      {name === 'book' ? (
        <>
          <Path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H11v16H6.5A2.5 2.5 0 0 0 4 21.5z" {...stroke} />
          <Path d="M20 5.5A2.5 2.5 0 0 0 17.5 3H13v16h4.5a2.5 2.5 0 0 1 2.5 2.5z" {...stroke} />
        </>
      ) : null}
      {name === 'search' ? (
        <>
          <Circle cx="11" cy="11" r="7" {...stroke} />
          <Path d="m20 20-4-4" {...stroke} />
        </>
      ) : null}
      {name === 'user' ? (
        <>
          <Circle cx="12" cy="8" r="4" {...stroke} />
          <Path d="M4.5 21a7.5 7.5 0 0 1 15 0" {...stroke} />
        </>
      ) : null}
      {name === 'bag' ? (
        <>
          <Path d="M5 8h14l-1 13H6z" {...stroke} />
          <Path d="M9 9V6a3 3 0 0 1 6 0v3" {...stroke} />
        </>
      ) : null}
      {name === 'menu' ? <Path d="M4 7h16M4 12h16M4 17h16" {...stroke} /> : null}
      {name === 'heart' ? (
        <Path
          d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21l7.8-7.5 1.1-1.1a5.5 5.5 0 0 0-.1-7.8z"
          {...(filled ? {} : stroke)}
          fill={filled ? color : 'none'}
          stroke={color}
          strokeWidth={1.7}
          strokeLinejoin="round"
        />
      ) : null}
      {name === 'star' ? (
        <Path d="m12 2.7 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-2.9-5.6 2.9 1.1-6.2L3 9.3l6.2-.9z" {...stroke} />
      ) : null}
      {name === 'truck' ? (
        <>
          <Path d="M3 6h11v11H3zM14 10h4l3 3v4h-7z" {...stroke} />
          <Circle cx="7" cy="19" r="2" {...stroke} />
          <Circle cx="18" cy="19" r="2" {...stroke} />
        </>
      ) : null}
      {name === 'shield' ? (
        <>
          <Path d="M12 3 4.5 6v5.5c0 4.7 3.2 8.1 7.5 9.5 4.3-1.4 7.5-4.8 7.5-9.5V6z" {...stroke} />
          <Path d="m9 12 2 2 4-5" {...stroke} />
        </>
      ) : null}
      {name === 'refresh' ? (
        <>
          <Path d="M20 7v5h-5" {...stroke} />
          <Path d="M18.2 16a8 8 0 1 1 .8-8l1 4" {...stroke} />
        </>
      ) : null}
      {name === 'headphones' ? (
        <>
          <Path d="M4 14v-2a8 8 0 0 1 16 0v2" {...stroke} />
          <Path d="M4 14h3v6H5a1 1 0 0 1-1-1zM20 14h-3v6h2a1 1 0 0 0 1-1z" {...stroke} />
        </>
      ) : null}
      {name === 'arrow' ? (
        <>
          <Path d="M5 12h14" {...stroke} />
          <Path d="m14 7 5 5-5 5" {...stroke} />
        </>
      ) : null}
      {name === 'instagram' ? (
        <>
          <Rect x="3" y="3" width="18" height="18" rx="5" {...stroke} />
          <Circle cx="12" cy="12" r="4" {...stroke} />
          <Circle cx="17.5" cy="6.5" r="0.5" fill={color} />
        </>
      ) : null}
      {name === 'facebook' ? (
        <Path d="M14 21v-8h3l.5-4H14V7c0-1.2.4-2 2-2h2V1.5c-.7-.1-1.8-.2-3-.2-3 0-5 1.8-5 5.2V9H7v4h3v8z" {...stroke} />
      ) : null}
      {name === 'pinterest' ? (
        <>
          <Circle cx="12" cy="12" r="9" {...stroke} />
          <Path
            d="M9.5 20c.7-2.2 1.2-4.2 1.5-5.5-.8-1.5.1-5 2.1-5 1.4 0 2 1 2 2.3 0 1.4-.9 3.5-1.4 5.4-.4 1.6.8 2.8 2.3 2.8 2.7 0 4.5-3.5 4.5-7.1 0-3-2.5-6-7-6-5 0-8 3.5-8 7.3 0 1.4.4 2.8 1.4 3.3"
            {...stroke}
          />
        </>
      ) : null}
      {name === 'package' ? (
        <>
          <Path d="m4 8 8-4 8 4v9l-8 4-8-4V8Z" {...stroke} />
          <Path d="m4 8 8 4 8-4M12 12v9M8 6l8 4" {...stroke} />
        </>
      ) : null}
      {name === 'map' ? (
        <>
          <Circle cx="12" cy="12" r="8.5" {...stroke} />
          <Path d="M12 7v5l3 2" {...stroke} />
        </>
      ) : null}
      {name === 'cart' ? (
        <>
          <Path d="M3 4h2l2.1 10.2h9.8l2-7.2H6" {...stroke} />
          <Circle cx="9" cy="19" r="1.25" {...stroke} />
          <Circle cx="17" cy="19" r="1.25" {...stroke} />
        </>
      ) : null}
      {name === 'eye' ? (
        <>
          <Path d="M2.5 12s3.45-5.25 9.5-5.25S21.5 12 21.5 12s-3.45 5.25-9.5 5.25S2.5 12 2.5 12Z" {...stroke} />
          <Circle cx="12" cy="12" r="2.5" {...stroke} />
        </>
      ) : null}
      {name === 'eyeOff' ? (
        <>
          <Path d="M2.5 12s3.45-5.25 9.5-5.25S21.5 12 21.5 12s-3.45 5.25-9.5 5.25S2.5 12 2.5 12Z" {...stroke} />
          <Circle cx="12" cy="12" r="2.5" {...stroke} />
          <Path d="M4 4l16 16" {...stroke} />
        </>
      ) : null}
      {name === 'lock' ? (
        <>
          <Rect x="5" y="10" width="14" height="10" rx="2" {...stroke} />
          <Path d="M8.5 10V7.5a3.5 3.5 0 0 1 7 0V10" {...stroke} />
        </>
      ) : null}
      {name === 'mail' ? (
        <>
          <Rect x="3" y="5" width="18" height="14" rx="2" {...stroke} />
          <Path d="m4 7 8 6 8-6" {...stroke} />
        </>
      ) : null}
      {name === 'check' ? <Path d="m5 12 4 4L19 6" {...stroke} /> : null}
      {name === 'chevron' ? <Path d="m9 5 7 7-7 7" {...stroke} /> : null}
      {name === 'grid' ? (
        <>
          <Rect x="3" y="3" width="7" height="7" rx="1.5" {...stroke} />
          <Rect x="14" y="3" width="7" height="7" rx="1.5" {...stroke} />
          <Rect x="3" y="14" width="7" height="7" rx="1.5" {...stroke} />
          <Rect x="14" y="14" width="7" height="7" rx="1.5" {...stroke} />
        </>
      ) : null}
      {name === 'list' ? (
        <>
          <Path d="M4 6h16M4 12h16M4 18h16" {...stroke} />
          <Circle cx="8" cy="6" r="1" fill={color} />
          <Circle cx="8" cy="12" r="1" fill={color} />
          <Circle cx="8" cy="18" r="1" fill={color} />
        </>
      ) : null}
      {name === 'phone' ? <Rect x="7" y="2" width="10" height="20" rx="2" {...stroke} /> : null}
      {name === 'cash' ? (
        <>
          <Rect x="3" y="6" width="18" height="12" rx="2" {...stroke} />
          <Circle cx="12" cy="12" r="3" {...stroke} />
        </>
      ) : null}
      {name === 'trash' ? (
        <>
          <Path d="M3 6h18" {...stroke} />
          <Path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" {...stroke} />
          <Path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" {...stroke} />
        </>
      ) : null}
      {name === 'rotate' ? (
        <>
          <Path d="M3 12a9 9 0 1 0 3-6.7L3 8" {...stroke} />
          <Path d="M3 3v5h5" {...stroke} />
        </>
      ) : null}
      {name === 'card' ? (
        <>
          <Rect x="2" y="5" width="20" height="14" rx="2" {...stroke} />
          <Path d="M2 10h20" {...stroke} />
        </>
      ) : null}
      {name === 'printer' ? (
        <>
          <Path d="M6 9V3h12v6M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" {...stroke} />
          <Path d="M6 14h12v7H6z" {...stroke} />
        </>
      ) : null}
      {name === 'copy' ? (
        <>
          <Rect x="8" y="8" width="11" height="11" rx="2" {...stroke} />
          <Path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" {...stroke} />
        </>
      ) : null}
      {name === 'calendar' ? (
        <>
          <Rect x="3" y="5" width="18" height="16" rx="2" {...stroke} />
          <Path d="M3 10h18M8 3v4M16 3v4" {...stroke} />
        </>
      ) : null}
      {name === 'pin' ? (
        <>
          <Path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" {...stroke} />
          <Circle cx="12" cy="10" r="2.5" {...stroke} />
        </>
      ) : null}
      {name === 'settings' ? (
        <>
          <Circle cx="12" cy="12" r="3" {...stroke} />
          <Path d="M19 13.5v-3l2-1.5-2-3.4-2.4 1a8 8 0 0 0-2.6-1.5L13.7 3h-4L9.4 5.1a8 8 0 0 0-2.6 1.5l-2.4-1L2.5 9l2 1.5v3L2.5 15l2 3.4 2.3-1a8 8 0 0 0 2.6 1.5l.3 2.1h4l.3-2.1a8 8 0 0 0 2.6-1.5l2.4 1 2-3.4-2-1.5Z" {...stroke} />
        </>
      ) : null}
      {name === 'logout' ? (
        <>
          <Path d="M10 5H4v14h6" {...stroke} />
          <Path d="M14 8l4 4-4 4M8 12h10" {...stroke} />
        </>
      ) : null}
      {name === 'box' ? (
        <>
          <Path d="m4 7 8-4 8 4-8 4-8-4Z" {...stroke} />
          <Path d="m4 7 8 4 8-4v10l-8 4-8-4V7ZM12 11v10" {...stroke} />
        </>
      ) : null}
      {name === 'download' ? (
        <>
          <Path d="M12 3v12m-4-4 4 4 4-4" {...stroke} />
          <Path d="M5 20h14" {...stroke} />
        </>
      ) : null}
      {name === 'help' ? (
        <>
          <Circle cx="12" cy="12" r="9" {...stroke} />
          <Path d="M9.7 9a2.4 2.4 0 1 1 3.2 2.3c-.9.4-.9 1-.9 1.7M12 17h.01" {...stroke} />
        </>
      ) : null}
      {name === 'more' ? (
        <>
          <Circle cx="5" cy="12" r="1" fill="currentColor" />
          <Circle cx="12" cy="12" r="1" fill="currentColor" />
          <Circle cx="19" cy="12" r="1" fill="currentColor" />
        </>
      ) : null}
      {name === 'users' ? (
        <>
          <Path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" {...stroke} />
          <Circle cx="9" cy="7" r="4" {...stroke} />
          <Path d="M22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8" {...stroke} />
        </>
      ) : null}
      {name === 'boxes' ? (
        <>
          <Path d="m12 2 9 5-9 5-9-5z" {...stroke} />
          <Path d="m3 12 9 5 9-5M3 17l9 5 9-5" {...stroke} />
        </>
      ) : null}
      {name === 'tag' ? (
        <>
          <Path d="M20.6 13.6 11 23l-9-9V3h11z" {...stroke} />
          <Circle cx="8" cy="8" r="1.5" {...stroke} />
        </>
      ) : null}
      {name === 'chart' ? <Path d="M4 20V10M10 20V4M16 20v-7M22 20V7" {...stroke} /> : null}
      {name === 'bell' ? (
        <>
          <Path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" {...stroke} />
          <Path d="M10 21h4" {...stroke} />
        </>
      ) : null}
    </Svg>
  );
}
