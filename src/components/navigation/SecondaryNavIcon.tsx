import type { ElementType } from 'react';

import { NavigationPictogram } from '@/components/navigation/NavigationPictogram';
import { getNavigationVisual } from '@/lib/navigationVisuals';

export function SecondaryNavIcon({
  id,
  fallbackIcon: _fallbackIcon,
  active = false,
  size = 'sm',
}: {
  id: string;
  fallbackIcon?: ElementType;
  active?: boolean;
  size?: 'sm' | 'lg';
}) {
  const visual = getNavigationVisual(id);

  return (
    <span
      className="inline-flex shrink-0 items-center justify-center transition-transform duration-150 group-hover:scale-[1.04] group-focus-visible:scale-[1.04]"
      data-navigation-tone={visual.tone}
      data-navigation-icon={visual.pictogram}
      aria-hidden="true"
    >
      <NavigationPictogram
        name={visual.pictogram}
        tone={visual.tone}
        size={size === 'lg' ? 'header' : 'item'}
        active={active}
      />
    </span>
  );
}
