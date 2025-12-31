declare module 'react-sparklines' {
  import { FC, CSSProperties } from 'react';

  export interface SparklinesProps {
    data: number[];
    width?: number;
    height?: number;
    margin?: number;
    children?: React.ReactNode;
  }

  export interface SparklinesLineProps {
    color?: string;
    style?: CSSProperties;
  }

  export const Sparklines: FC<SparklinesProps>;
  export const SparklinesLine: FC<SparklinesLineProps>;
}
