import { AbstractDestroyable } from '../../base/AbstractDestroyable';
import { Destroyable } from '../../base/Destroyable';
import { Surface } from '../Surface';
import { Visual } from '../Visual';
import { KeyExpression } from './KeyExpression';
import { VoidCallback1, BlankPredicate } from '../../common';
export declare type KeyEmitter = Surface | Visual | HTMLElement;
export declare abstract class KeyBehavior extends AbstractDestroyable {
    protected object: KeyEmitter;
    static for(object: KeyEmitter): KeyBehavior;
    private predicateStack;
    protected constructor(object: KeyEmitter);
    on(expressions: string | string[], callback: VoidCallback1<any>): KeyBehavior;
    when(predicate: BlankPredicate, configurator: VoidCallback1<KeyBehavior>): KeyBehavior;
    protected abstract createListener(ke: KeyExpression, callback: VoidCallback1<any>, predicate?: BlankPredicate): Destroyable;
}
