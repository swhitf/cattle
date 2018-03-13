import { GridChangeSet } from "./GridChangeSet";
import { Event } from "../../base/Event";
export declare class GridChangeEvent extends Event {
    changes: GridChangeSet;
    constructor(changes: GridChangeSet);
}
