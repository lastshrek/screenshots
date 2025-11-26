import { Rectangle } from 'electron';
export interface Display extends Rectangle {
    id: number;
    scaleFactor: number;
}
export declare const getAllDisplays: () => Display[];
declare const _default: () => Display;
export default _default;
