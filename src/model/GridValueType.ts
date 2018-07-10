import * as chrono from 'chrono-node';
import * as moment from 'moment';

import { GridCell } from './GridCell';


/**
 * Represents the value type for a GridCell.
 */
export interface GridValueType {

    /**
     * The name of the type.
     */
    readonly name:string;

    /**
     * Accepts a raw string value and, if necessary, converts it to a formatted form for this
     * value type.  If the input is not valid for this value type, the value will be reset
     * to a constant value appropriate for the value type.
     */
    format(value:string, cell:GridCell):string;

    /**
     * Accepts a raw string value and converts it to a typed value according to the value 
     * type.  Returns null if the input value is not valid.
     */
    convert(value:string, cell:GridCell):any;
}

function parseFloatWithFallback(input:string, fallback:any):any
{
    const num = parseFloat(input);
    if (isNaN(num)) return fallback || num;
}

class NumberType implements GridValueType 
{
    public readonly name = 'number';
    
    public format(value:string, cell:GridCell):string 
    {
        if (isNues(value)) return '';
        const num = parseFloat(value);
        if (isNaN(num)) return '';
        //Cell data can include a format object with instructions for formatting
        const precision = cell.prop('type.precision') as number;
        return !!precision ? num.toFixed(precision) : num.toString();
    }

    public convert(value:string, cell:GridCell) 
    {
        if (isNues(value)) return 0;
        const num = parseFloat(this.format(value, cell));
        return isNaN(num) ? 0 : num;
    }
} 

class DateType implements GridValueType 
{
    public readonly name = 'date';

    public format(value:string, cell:GridCell):string 
    {
        if (isNues(value)) return '';
        const dt = chrono.parseDate(value)
        if (!dt) return '';
        const mt = moment(dt);
        //Cell data can include a format object with instructions for formatting
        const fmt = cell.prop('type.format') as string;
        return mt.format(fmt || 'L');
    }

    public convert(value:string, cell:GridCell) 
    {
        if (isNues(value)) return null;
        const dt = chrono.parseDate(value)
        if (!dt) return null;
        return moment(dt);
    }
} 

/**
 * Standard GridValueType implementations.
 */
export const GridValueTypes = 
{
    string: <GridValueType>{
        name: 'string',
        format: x => x,
        convert: x => x,
    },
    
    number: new NumberType() as GridValueType,
    
    date: new DateType() as GridValueType,
}

function isNues(val:string):boolean
{
    //Is Null Undefined or Empty String
    return val === null || val === undefined || val === '';
}