import { Destroyable } from '../../base/Destroyable';


export interface NetHandle extends Destroyable
{
    readonly type:string;

    visible:boolean;
}