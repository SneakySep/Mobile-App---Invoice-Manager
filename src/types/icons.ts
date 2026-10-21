import type { ComponentProps } from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';

/** Every icon name supported by the Material Community icon set. */
export type AppIconName = ComponentProps<typeof MaterialCommunityIcons>['name'];
