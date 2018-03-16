

export interface BufferUpdateCallback {
    (gfx:CanvasRenderingContext2D):void;
}

export class Buffer {

    public readonly id:string;
    
    private canvas:HTMLCanvasElement;

    constructor(id:string) {
        this.id = id;
    }

    public get valid():boolean {
        return !!this.canvas;
    }

    public get context():CanvasRenderingContext2D {
        return this.canvas.getContext('2d');
    }

    public get width():number {
        return this.canvas.width;
    }

    public set width(val:number) {
        this.canvas.width = val;
    }

    public get height():number {
        return this.canvas.height;
    }

    public set height(val:number) {
        this.canvas.height = val;
    }

    public drawTo(gfx:CanvasRenderingContext2D):void {
        gfx.drawImage(this.canvas, 0, 0);
    }

    public invalidate(width:number, height:number):void {
        delete this.canvas;
        this.canvas = document.createElement('canvas');
        this.canvas.width = width;
        this.canvas.height = height;
    }

    public update(callback:BufferUpdateCallback):void {
        callback(this.canvas.getContext('2d'));
    }
}