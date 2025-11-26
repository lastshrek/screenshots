import { Display } from './getDisplay';
export interface Bounds {
    x: number;
    y: number;
    width: number;
    height: number;
}
export interface ScreenshotsData {
    bounds: Bounds;
    display: Display;
}
