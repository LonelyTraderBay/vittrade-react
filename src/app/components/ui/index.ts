/**
 * ══════════════════════════════════════════════════════════
 *  UI Components — Central Export
 * ══════════════════════════════════════════════════════════
 *
 *  Single import point for all UI components:
 *  import { IconButton, StatCard, TrCard } from '@/components/ui';
 */

/* ─── Custom UI Components ─── */
export { TrCard, TrCardStat } from './TrCard';
export { CTAButton } from './CTAButton';
export { InputField } from './InputField';
export { SectionHeader } from './SectionHeader';
export { ConfirmationDialog } from './ConfirmationDialog';
export { BottomSheetV2 } from './BottomSheetV2';
export { PullToRefresh } from './PullToRefresh';
export { ThemedToaster } from './ThemedToaster';

/* ─── New Extracted Components ─── */
export {
  IconButton,
  IconOnlyButton,
  BackButton,
  CloseButton,
  type IconButtonProps,
  type IconButtonVariant,
  type IconButtonSize,
} from './IconButton';

export {
  StatCard,
  StatItem,
  StatGrid,
  PercentageStat,
  type StatCardProps,
  type StatItemProps,
  type StatTrend,
  type StatSize,
} from './StatCard';

/* ─── Shadcn UI Components ─── */
export { Button } from './button';
export { Input } from './input';
export { Label } from './label';
export { Checkbox } from './checkbox';
export { Switch } from './switch';
export { Slider } from './slider';
export { Badge } from './badge';
export { Avatar, AvatarImage, AvatarFallback } from './avatar';
export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent } from './card';
export { Tabs, TabsList, TabsTrigger, TabsContent } from './tabs';
export { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription } from './dialog';
export { Sheet, SheetTrigger, SheetContent, SheetHeader, SheetFooter, SheetTitle, SheetDescription } from './sheet';
export { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from './select';
export { Popover, PopoverTrigger, PopoverContent } from './popover';
export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from './tooltip';
export { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from './accordion';
export { Alert, AlertTitle, AlertDescription } from './alert';
export { Progress } from './progress';
export { Separator } from './separator';
export { Skeleton } from './skeleton';
export { Table, TableHeader, TableBody, TableFooter, TableHead, TableRow, TableCell, TableCaption } from './table';
export { Textarea } from './textarea';
