/**
 * Barrel export for UI compatibility shims.
 * Screens import from this instead of 'react-native-paper'.
 *
 * Usage: replace
 *   import { Button, Card, FAB } from 'react-native-paper';
 * with:
 *   import { Button, Card, FAB } from '../components/ui';
 */

export { Button } from './Button';
export { Card } from './Card';
export { Chip } from './Chip';
export { Divider } from './Divider';
export { FAB } from './FAB';
export { IconButton } from './IconButton';
export { ProgressBar } from './ProgressBar';
export { SegmentedButtons } from './SegmentedButtons';
export { TextInput } from './TextInput';

// Switch is identical in RN — re-export directly
export { Switch } from 'react-native';

