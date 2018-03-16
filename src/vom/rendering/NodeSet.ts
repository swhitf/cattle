import { KeyedSet } from "../../base/KeyedSet";
import { Node } from "./Node";


export class NodeSet extends KeyedSet<Node> {

    constructor() {
        super(x => x.key);
    }

    public prune(cycle:number) 
    {
        this.list = this.list.filter(tm => {

            if (tm.cycle != cycle)
            {
                delete this.index[tm.key];
                return false;
            }

            return true;
        });
    }
}