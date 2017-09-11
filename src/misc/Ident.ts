

let start = new Date().getTime().toString();
let count = 0;

export class Ident
{
    public static next(prefix:string = 'C'):string
    {
        return prefix + start + '-' + (count++);
    }
}
