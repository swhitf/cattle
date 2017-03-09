

let start = new Date().getTime().toString();
let count = 0;

export class RefGen
{
    public static next(prefix:string = 'C'):string
    {
        return prefix + start + '-' + (count++);
    }
}
