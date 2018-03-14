export class Buffer {

    public readonly id:string;
    public readonly data:HTMLCanvasElement;

    public valid:boolean = false;

    constructor(id:string) {
        this.id = id;
        this.data = document.createElement('canvas');
    }

    public get context():CanvasRenderingContext2D {
        return this.data.getContext('2d');
    }

    public get width():number {
        return this.data.width;
    }

    public set width(val:number) {
        this.data.width = val;
    }

    public get height():number {
        return this.data.height;
    }

    public set height(val:number) {
        this.data.height = val;
    }
}