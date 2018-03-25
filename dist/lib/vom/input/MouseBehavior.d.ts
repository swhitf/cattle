import { AbstractDestroyable } from '../../base/AbstractDestroyable';
import { Surface } from '../Surface';
import { Visual } from '../Visual';
import { VoidCallback1, BlankPredicate } from '../../common';
import { MouseExpression } from './MouseExpression';
import { Destroyable } from '../../base/Destroyable';
export declare type MouseEmitter = Surface | Visual | HTMLElement;
export declare abstract class MouseBehavior extends AbstractDestroyable {
    protected object: MouseEmitter;
    static for(object: MouseEmitter): MouseBehavior;
    private predicateStack;
    protected constructor(object: MouseEmitter);
    on(expressions: string | string[], callback: VoidCallback1<any>): MouseBehavior;
    when(predicate: BlankPredicate, configurator: VoidCallback1<MouseBehavior>): MouseBehavior;
    protected abstract createListener(me: MouseExpression, callback: VoidCallback1<any>, predicate?: BlankPredicate): Destroyable;
}
