import { Visual } from '../Visual';
export interface AnimationBuilder<T extends Visual> {
    every(intervalTime: number, callback: ContinuousAnimationCallback<T>): ContinuousAnimationBuilder<T>;
    over(tweenTime: number): TweenAnimationBuilder<T>;
}
export interface ContinuousAnimationBuilder<T extends Visual> {
    every(interval: number, callback: ContinuousAnimationCallback<T>): ContinuousAnimationBuilder<T>;
}
export interface ContinuousAnimationCallback<T extends Visual> {
    (visual: T): boolean | void;
}
export interface TweenAnimationBuilder<T extends Visual> {
    tween(from: number, to: number, callback: TweenAnimationCallback<T>): TweenAnimationBuilder<T>;
    then(): AnimationBuilder<T>;
}
export interface TweenAnimationCallback<T extends Visual> {
    (visual: T, value: number): void;
}
export declare abstract class Animate {
    private constructor();
    static visual<T extends Visual>(visual: T): AnimationBuilder<T>;
}
