declare module 'lucide-react' {
  import { ComponentType, SVGProps } from 'react';
  
  export interface LucideIcon extends ComponentType<SVGProps<SVGSVGElement>> {}
  
  export const Search: LucideIcon;
  export const Calendar: LucideIcon;
  export const User: LucideIcon;
  export const Mail: LucideIcon;
  export const Phone: LucideIcon;
  export const MapPin: LucideIcon;
  export const Package: LucideIcon;
  export const Eye: LucideIcon;
  export const Download: LucideIcon;
  export const Filter: LucideIcon;
} 