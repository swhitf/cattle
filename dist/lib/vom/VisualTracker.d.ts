import { Visual } from './Visual';
export declare class VisualTracker {
    private values;
    get(key: string): Visual;
    set(key: string, visual: Visual): void;
}
