import { Point } from '../geom/Point';
export interface BufferTypeConfiguration {
    identify(object: any): string;
    measure(object: any): Point;
}
export declare class BufferManager {
    private configs;
    private backMap;
    private frontMap;
    configure(type: string, config: BufferTypeConfiguration): BufferManager;
    getFor(type: string, object: any): HTMLCanvasElement;
    retainFor(type: string, object: any): void;
    beginRender(): void;
    endRender(): void;
    private resolve(id);
}
