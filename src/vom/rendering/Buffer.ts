

export interface BufferUpdateCallback {
    (gfx:CanvasRenderingContext2D):void;
}

export class Buffer {

    public readonly id:string;
    
    private canvas:HTMLCanvasElement;

    constructor(id:string) {
        this.id = id;
        this.canvas = document.createElement('canvas');
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
        this.canvas.width = width;
        this.canvas.height = height;
        const gfx = this.canvas.getContext('2d');
        gfx.setTransform(1, 0, 0, 1, 0, 0);
        gfx.clearRect(0, 0, width, height);
    }

    public update(callback:BufferUpdateCallback):void {
        callback(this.canvas.getContext('2d'));
    }
}