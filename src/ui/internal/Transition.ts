

export interface Transition
{
    lerp<T>(prop:string, val:T):T;
}