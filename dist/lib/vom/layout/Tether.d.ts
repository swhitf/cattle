import { Visual } from '../Visual';
import { Destroyable } from '../../base/Destroyable';
export declare type TetherPosition = 'top' | 'right' | 'bottom' | 'left' | 'center';
export interface TetherSettings {
}
export declare class Tether {
    static anchor(subject: Visual): Destroyable;
    static dock(subject: Visual, to: Visual, where: TetherPosition): Destroyable;
}
