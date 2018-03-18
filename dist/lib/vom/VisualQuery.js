"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var u = require("../misc/Util");
var stmt_cache = {};
var term_cache = {};
var ExpOps = /** @class */ (function () {
    function ExpOps() {
    }
    ExpOps.anyDesc = '~';
    ExpOps.directDesc = '>';
    ExpOps.rootScan = '@';
    ExpOps.all = [
        ExpOps.anyDesc,
        ExpOps.directDesc,
    ];
    return ExpOps;
}());
function select(input, query) {
    var visuals = Array.isArray(input)
        ? input
        : input.toArray(true);
    var expr = compile_expr(query);
    var sets = [];
    for (var _i = 0, expr_1 = expr; _i < expr_1.length; _i++) {
        var stmt = expr_1[_i];
        var selection = visuals.slice(0);
        for (var _a = 0, stmt_1 = stmt; _a < stmt_1.length; _a++) {
            var sgmt = stmt_1[_a];
            selection = apply_sgmt(visuals, selection, sgmt);
        }
        sets.push(selection);
    }
    //Return all nodes in all selections
    return u.flatten(sets);
}
exports.select = select;
function test(input, query) {
    var visuals = Array.isArray(input)
        ? input
        : input.toArray(true);
    return select(visuals, query).length == 1;
}
exports.test = test;
function apply_sgmt(visuals, selection, sgmt) {
    if (sgmt.op == ExpOps.rootScan) {
        //Check matches expression
        return visuals.filter(function (x) { return match_term(x, sgmt.term); });
    }
    if (sgmt.op == ExpOps.anyDesc) {
        return visuals
            .filter(function (x) { return selection.some(function (p) { return match_descendant(x, p); }); })
            .filter(function (x) { return match_term(x, sgmt.term); });
    }
    if (sgmt.op == ExpOps.directDesc) {
        return visuals
            .filter(function (x) { return selection.some(function (p) { return match_direct_descendant(x, p); }); })
            .filter(function (x) { return match_term(x, sgmt.term); });
    }
    return [];
}
function compile_expr(expression) {
    //Split on comma
    var statements = expression.split(',')
        .filter(function (x) { return !!x; })
        .map(function (x) { return x.trim(); });
    //Compile each statement
    return statements.map(function (x) { return compile_stmt(x); });
}
function compile_stmt(statement) {
    if (stmt_cache[statement]) {
        return stmt_cache[statement];
    }
    var compiled = [];
    var currOp = ExpOps.rootScan;
    var currTerm = "";
    var inSpace = false;
    var close = function () {
        if (currTerm != "") {
            compiled.push({
                op: currOp,
                term: currTerm,
            });
        }
        currOp = ExpOps.directDesc;
        currTerm = "";
    };
    for (var i = 0; i < statement.length; i++) {
        var c = statement.charAt(i);
        if (ExpOps.all.indexOf(c) >= 0) {
            close();
            currOp = c;
        }
        else if (c == ' ') {
            inSpace = true;
        }
        else {
            if (inSpace) {
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
function compile_term(term) {
    term = term.toLowerCase().trim();
    if (term_cache[term]) {
        return term_cache[term];
    }
    var all = [];
    var current = '';
    function close() {
        if (current.length) {
            all.push(current);
        }
        ;
        current = '';
    }
    for (var i = 0; i < term.length; i++) {
        var c = term.charAt(i);
        if (c === '.' || c === ':') {
            close();
        }
        current += c;
    }
    close();
    all.map(function (x) { return x.trim(); }).filter(function (x) { return !x.length; });
    return term_cache[term] = all;
    //Build regex from term format:
    //* meaning required anything
    // let pattern = '^' + term.trim() + '$';
    // pattern = pattern.replace(/\./g, '\\.'); //Escape dots
    // pattern = pattern.replace(/\*/g, '.*'); //Support wildcard (*)
}
function match_descendant(subject, parent) {
    var focus = subject;
    while (!!focus) {
        if (focus.parent == parent) {
            return true;
        }
        focus = focus.parent;
    }
    return false;
}
function match_direct_descendant(subject, parent) {
    return subject.parent == parent;
}
function match_term(subject, term) {
    var compiledTerm = compile_term(term);
    for (var _i = 0, compiledTerm_1 = compiledTerm; _i < compiledTerm_1.length; _i++) {
        var tp = compiledTerm_1[_i];
        if (tp.charAt(0) === '.') {
            if (!subject.classes.has(tp.substr(1))) {
                return false;
            }
        }
        else if (tp.charAt(0) === ':') {
            if (!subject.traits.has(tp.substr(1))) {
                return false;
            }
        }
        else {
            if (subject.type.toLowerCase() !== tp) {
                return false;
            }
        }
    }
    return true;
}
//# sourceMappingURL=VisualQuery.js.map