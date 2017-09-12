import { Border } from './Border';
import { Theme } from './Theme';
import * as u from '../../misc/Util';


export class DefaultTheme extends Theme
{
    constructor()
    {
        super('Default');
        this.extend(default_rules());
    }
}

function default_rules():any
{
    return {
    };
}