import { express_str } from "./cli";

let logStack = false;

export type GeneralProposition<T> = T | [GeneralProposition<T>, PropOp, GeneralProposition<T>] | ["-", GeneralProposition<T>] | TruthProposition

export type TruthProposition = typeof TRUE | typeof FALSE

export type PropOp = "->" | "A" | "V"
export type Proposition = GeneralProposition<string>


let source:Proposition = ["p", "->", "q"];
let source2:Proposition = ["p", "A", "p"];
let target:Proposition = [["-", "q"], "->", ["-", "p"]];


/* 
 * Define equivalences 
 */

// You only need 3 logical symbols to define all basic eqivalences
export const P = Symbol("P");
export const Q = Symbol("Q");
export const R = Symbol("R");

export const TRUE = ["","TRUE",""];
export const FALSE = ["","FALSE",""];

// An equivalence is a set of abstract propositions that can be legally converted between each other
export type Equivalence = AbstractProposition[]
export type LogicalSymbol = (typeof P) | (typeof Q) | (typeof R)
export type AbstractProposition = GeneralProposition<LogicalSymbol>

// Define basic equivalencies
export let equivalences: { [name:string]:Equivalence } = {
    "Contradiction": [
        [P,"A",["-",P]],
        FALSE
    ],
    "Excluded Middle":[
        [P,"V",["-",P]],
        TRUE
    ],
    "Identity Laws (AND)":[
        [P,"A",TRUE],
        P
    ],
    "Identity Laws (OR)":[
        [P,"V",FALSE],
        P
    ],
    "Domination Laws (OR)":[
        [P,"V",TRUE],
        TRUE
    ],
    "Domination Laws (AND)":[
        [P,"A",FALSE],
        FALSE
    ],
    "Idempotent Laws (OR)":[
        [P,"V",P],
        P
    ],
    "Idempotent Laws (AND)":[
        [P,"A",P],
        P
    ],
    "Double Negation":[
        P,
        ["-",["-",P]]
    ],
    "Commutative Laws (AND)":[
        [P,"A",Q],
        [Q,"A",P]
    ],
    "Commutative Laws (OR)":[
        [P,"V",Q],
        [Q,"V",P]    
    ],
    "Associative Laws (AND)":[
        [[P,"A",Q],"A",R],
        [P,"A",[Q,"A",R]]
    ],
    "Associative Laws (OR)":[
        [[P,"V",Q],"V",R],
        [P,"V",[Q,"V",R]]
    ],
    "Distributive Laws (1)":[
        [P,"V",[Q,"A",R]],
        [[P,"V",Q],"A",[P,"V",R]]
    ],
    "Distributive Laws (2)":[
        [P,"A",[Q,"V",R]],
        [[P,"A",Q],"V",[P,"A",R]]
    ],
    "De Morgan’s Laws (1)":[
        ["-",[P,"A",Q]],
        [["-",P],"V",["-",Q]]
    ],
    "De Morgan’s Laws (2)":[
        ["-",[P,"V",Q]],
        [["-",P],"A",["-",Q]]
    ],
    "Absorption Laws (1)":[
        [P,"V",[P,"A",Q]],
        P
    ],
    "Absorption Laws (2)":[
        [P,"A",[P,"V",Q]],
        P
    ],
    "Implication Simplification":[
        [P,"->",Q],
        [["-",P],"V",Q]
    ],
    "Contrapositive":[
        [P,"->",Q],
        [["-",Q],"->",["-",P]]
    ]
}
// Add reverse possibilities
for (let name in equivalences) {
    let e = equivalences[name];
    
    // Determine if it is reversable 
    // If the number of symbols decreases, not reversible
    let symCount = [];
    for (let p of e) {
        symCount.push(countAbstractSymbols(p).unique.length);
    }
    if (symCount[1] == symCount[0]) {
        // TODO: check that the same symbols are present, doesn't matter rn ig
        // No information is lost, is reversible
        let newname = "Reverse " + name;
        equivalences[newname] = [
            equivalences[name][1],
            equivalences[name][0]
        ]
    }
}


function countAbstractSymbols(prop:AbstractProposition):{ total:number, unique:LogicalSymbol[] } {
    if (typeof prop == 'symbol') { return { total:1, unique:[prop] }; }
    let sum = 0;
    let unique = [];
    for (let s of prop) {
        if (typeof s == 'object') {
            let inner = countAbstractSymbols(s);
            sum += inner.total;
            for (let u of inner.unique) {
                if (!unique.includes(u)) { unique.push(u); }
            }
        } else if (typeof s == 'symbol') {
            sum += 1;
            if (!unique.includes(s)) { unique.push(s); }
        }
    }
    return { total:sum, unique:unique };
}


/* 
 * Check if two statements are identical
 * NOTE: Basic stringify check means ordering of symbols will invalidate identical, 
 * differently ordered symbols. That's fine, this is normal for real operations,
 * but it means we need to include equivalences purely for swapping order around.
 */ 
function areEquivalentSymbols(a:Proposition, b:Proposition): boolean {
    return (JSON.stringify(a) == JSON.stringify(b));
}

// Check if an equivalence can be used to transform a proposition
function canUseEquivalence(p:Proposition, e:Equivalence): true | string {
    try { if (checkPropositionMatch(p, e[0]) == true) { return true; } else { 
            throw new Error("checkMatch returned false instead of throwing"); 
    } } catch(e) { return (e as Error).message + (logStack ? "\n"+(e as Error).stack : "") }
}


// check if a certain abstract proposition is a match for a certain specific proposition
// throw errors instead of returning false to get info about what doesnt match
type SymbolProps = { [P]:Proposition[],[Q]:Proposition[],[R]:Proposition[] }
function checkPropositionMatch(x:Proposition, eq:AbstractProposition): boolean {
    // Create new empty object to keep track of what abstract symbol a proposition is assigned to ensure 
    // the ones with the same one are identical
    let symbolProps:SymbolProps = { [P]:[], [Q]:[], [R]:[] };    
    let helper_result = _checkPropositionMatch_helper(x, eq, symbolProps);
    
    let map = buildSymbolMap(x, eq);

    return helper_result;
}
function _checkPropositionMatch_helper(x:Proposition, eq:AbstractProposition, symbolProps:SymbolProps): boolean {

    let E_isBaseSymbol = typeof eq == 'symbol';
    let X_isBaseSymbol = typeof x == 'string';
    
    // An abstract base symbol matches any proposition
    // Also, store the associated proposition

    if (E_isBaseSymbol) { symbolProps[eq as symbol].push(x); return true; }
    // If input is some base variable, but abstract is more complex, symbol cannot match
    if (X_isBaseSymbol) { throw new Error("Proposition is a base variable but equivalence is more complex."); }


    let E_isNeg = typeof eq[0] == 'string' && eq[0] == '-';
    let X_isNeg = x[0] == '-';

    // If both are negators, recurse with new propositions without the neg
    if (E_isNeg != X_isNeg) { throw new Error("Either proposition or equivalence is a negator, but not both."); 
    } else if (E_isNeg) { return _checkPropositionMatch_helper(x[1], eq[1], symbolProps); }

    // At this point, both must be [Prop, "->|V|A", Prop] with some op code in the middle
    // First point where you are dealing with two potentially same or different propositions
    // It is necessary to make sure propositions with the same symbol are identical

    if (eq[1] != x[1]) { throw new Error("Proposition and equivalence operations do not match."); }

    return true;
}


export function getLegalEquivalences(prop:Proposition):string[] {
    let legal = [];
    for (let n in equivalences) {
        let result = canUseEquivalence(prop, equivalences[n]);
        if (result == true) {
            legal.push(n);
        }
    }
    return legal;
}


type SymbolMap = { [P]?:Proposition, [Q]?:Proposition, [R]?:Proposition }
function buildSymbolMap(p:Proposition, abs_p:AbstractProposition): SymbolMap {
    // Assume Mappable
    let map: SymbolMap = { [P]:undefined, [Q]:undefined, [R]:undefined }
    if (typeof abs_p == 'object') {
        let iN = 0;
        for (let item of abs_p) {
            // An item in the abs_p can either be a symbol or string or object
            // if its a symbol or object, then it has a correlating proposition, recurse
            // if string, check for idential object
            if (typeof item == 'string') {
                // confirm same string real prop
                let samestr = item == p[iN];
                if (!samestr) { throw new Error('Abstract proposition and real proposition do not match: \n'+ JSON.stringify(abs_p)+"\n"+ JSON.stringify(p)); }
            } else {
                let submap = buildSymbolMap(p[iN], item);
                for (let k of [P,Q,R]) {
                    if (map[k] && submap[k] && map[k] != submap[k]) {
                        throw new Error("Non-identical symbolmapping!");
                    } 
                }

                map = {
                    [P]: map[P] ? map[P] : submap[P],
                    [Q]: map[Q] ? map[Q] : submap[Q],
                    [R]: map[R] ? map[R] : submap[R],
                }
            }
            iN++;
        }
    } else {
        map[abs_p] = p;
    }
    return map;
}

function buildMappedProposition(abs_p:AbstractProposition, map:SymbolMap): Proposition {
    if (typeof abs_p == 'object') {
        let prop = [];
        for (let item of abs_p) {
            if (typeof item == 'string') {
                prop.push(item);
            } else {
                prop.push(buildMappedProposition(item, map));
            }
        }
        return prop as any;
    } else {
        return map[abs_p];
    }
}

export function performEquivalenceSwap(p:Proposition, rule:Equivalence):Proposition {
    // Check
    if (!canUseEquivalence(p, rule)) { throw new Error("Invalid equivalence for given proposition."); }

    let map = buildSymbolMap(p, rule[0]);
    let prop = buildMappedProposition(rule[1], map);
    return prop;
}





