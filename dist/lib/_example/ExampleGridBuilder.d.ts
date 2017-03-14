import { GridModel } from './../model/GridModel';
import { Style } from '../model/styled/Style';
export declare class ExampleGridBuilder {
    private lines;
    private cols;
    private style;
    constructor(lines?: number, cols?: number, style?: Style);
    build(): GridModel;
    private createColumnRow(cells);
    private createResourceRow(cells, line);
}
