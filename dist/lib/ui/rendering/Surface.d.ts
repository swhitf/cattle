export declare class Surface {
    static create(container: HTMLElement): Surface;
    readonly container: HTMLElement;
    readonly canvas: HTMLCanvasElement;
    private sequence;
    private constructor(container, canvas);
    readonly width: number;
    readonly height: number;
    private onContainerResize(entries);
}
