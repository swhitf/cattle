import * as bases from 'bases';


const Alpha26 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

export class Base26
{
    public static num(num:number):Base26 
    {
        return new Base26(num, bases.toAlphabet(num, Alpha26));
    }

    public static str(str:string):Base26 
    {
        return new Base26(bases.fromAlphabet(str.toUpperCase(), Alpha26), str);
    }

    public readonly num:number;
    public readonly str:string;

    private constructor(num:number, str:string) 
    {
        this.num = num;
        this.str = str;
    }
}