import { Visual } from './Visual';
import * as u from '../misc/Util';


const stmt_cache = {} as any;
const term_cache = {} as any;

class ExpOps
{
    public static anyDesc = '~';
    public static directDesc = '>';
    public static rootScan = '@';

    public static all =
    [
        ExpOps.anyDesc,
        ExpOps.directDesc,
    ];
}

interface ExpressionSegment
{
    op:string;
    term:string;
}

type ExpressionStatement = Array<ExpressionSegment>;
type Expression = Array<ExpressionStatement>;

export function select(input:Visual[], query:string):Visual[];
export function select(input:Visual, query:string):Visual[];
export function select(input:any, query:string):Visual[]
{
    let visuals = Array.isArray(input) 
        ? (input as Visual[]) 
        : (input as Visual).toArray(true);

    let expr = compile_expr(query);
    let sets:Visual[][] = [];

    for (let stmt of expr)
    {
        let selection = visuals.slice(0);

        for (let sgmt of stmt)
        {
            selection = apply_sgmt(visuals, selection, sgmt)
        }

        sets.push(selection);
    }

    //Return all nodes in all selections
    return u.flatten<Visual>(sets);
}

export function test(input:Visual|Visual[], query:string):boolean
{
    let visuals = Array.isArray(input) 
        ? (input as Visual[]) 
        : (input as Visual).toArray(true);

    return select(visuals, query).length == 1;
}

function apply_sgmt(visuals:Visual[], selection:Visual[], sgmt:ExpressionSegment):Visual[]
{
    if (sgmt.op == ExpOps.rootScan)
    {
        //Check matches expression
        return visuals.filter(x => match_term(x, sgmt.term));
    }
    if (sgmt.op == ExpOps.anyDesc)
    {
        return visuals
            //Check is descendant
            .filter(x => selection.some(p => match_descendant(x, p)))
            //Check matches expression
            .filter(x => match_term(x, sgmt.term));
    }
    if (sgmt.op == ExpOps.directDesc)
    {
        return visuals
            //Check is direct descendant
            .filter(x => selection.some(p => match_direct_descendant(x, p)))
            //Check matches expression
            .filter(x => match_term(x, sgmt.term));
    }

    return [];
}

function compile_expr(expression:string):Expression
{
    //Split on comma
    let statements = expression.split(',')
        .filter(x => !!x)
        .map(x => x.trim());

    //Compile each statement
    return statements.map(x => compile_stmt(x));
}

function compile_stmt(statement:string):ExpressionStatement
{
    if (stmt_cache[statement])
    {
        return stmt_cache[statement];
    }

    let compiled:ExpressionStatement = [];

    let currOp = ExpOps.rootScan;
    let currTerm = "";
    let inSpace = false;

    let close = () =>
    {
        if (currTerm != "")
        {
            compiled.push(
            {
                op: currOp,
                term: currTerm,
            });
        }

        currOp = ExpOps.directDesc;
        currTerm = "";
    };

    for (let i = 0; i < statement.length; i++)
    {
        let c = statement.charAt(i);
        if (ExpOps.all.indexOf(c) >= 0)
        {
            close();
            currOp = c;
        }
        else if (c == ' ')
        {
            inSpace = true;   
        }
        else
        {
            if (inSpace)
            {
                close();
                currOp = ExpOps.anyDesc;
                inSpace = false;
            }

            currTerm += c;
        }
    }

    close();

    return stmt_cache[statement] = compiled;
}

function compile_term(term:string):string[]
{
    term = term.toLowerCase().trim();

    if (term_cache[term])
    {
        return term_cache[term];
    }

    let all = [] as string[];
    let current = '';

    function close() 
    {
        if (current.length) { all.push(current) };
        current = '';
    }

    for (let i = 0; i < term.length; i++)
    {
        let c = term.charAt(i);

        if (c === '.' || c === ':')
        {
            close();
        }

        current += c;
    }

    close();
    all.map(x => x.trim()).filter(x => !x.length);

    return term_cache[term] = all;

    //Build regex from term format:
    //* meaning required anything
    // let pattern = '^' + term.trim() + '$';
    // pattern = pattern.replace(/\./g, '\\.'); //Escape dots
    // pattern = pattern.replace(/\*/g, '.*'); //Support wildcard (*)
}

function match_descendant(subject:Visual, parent:Visual):boolean
{
    let focus = subject;
    while (!!focus)
    {
        if (focus.parent == parent)
        {
            return true;
        }
        
        focus = focus.parent;
    }
    
    return false;
}

function match_direct_descendant(subject:Visual, parent:Visual):boolean
{
    return subject.parent == parent;
}

function match_term(subject:Visual, term:string):boolean
{
    let compiledTerm = compile_term(term);

    for (let tp of compiledTerm)
    {
        if (tp.charAt(0) === '.')
        {
            if (!subject.classes.has(tp.substr(1)))
            {
                return false;
            }
        }
        else if (tp.charAt(0) === ':')
        {
            if (!subject.traits.has(tp.substr(1)))
            {
                return false;
            }
        }
        else
        {
            if (subject.type.toLowerCase() !== tp)
            {
                return false;
            }
        }
    }

    return true;
}