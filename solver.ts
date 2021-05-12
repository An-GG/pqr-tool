type GeneralProposition<T> = T | [GeneralProposition<T>, PropOp, GeneralProposition<T>] | ["-", GeneralProposition<T>]

type PropOp = "->" | "A" | "V"
type Proposition = GeneralProposition<string>




let source:Proposition = ["p", "->", "q"];
let source2:Proposition = ["p", "A", "p"];
let target:Proposition = [["-", "q"], "->", ["-", "p"]];





/* 
 * Define equivalences 
 */

// You only need 3 logical symbols to define all basic eqivalences
const P = Symbol("P");
const Q = Symbol("Q");
const R = Symbol("R");

// An equivalence is a set of abstract propositions that can be legally converted between each other
type Equivalence = AbstractProposition[]
type LogicalSymbol = (typeof P) | (typeof Q) | (typeof R)
type AbstractProposition = GeneralProposition<LogicalSymbol>

let equivalences: { [name:string]:Equivalence } = {
    "Idempotent Laws (OR)":[
        [P,"V",P],
        P
    ],
    "Idempotent Laws (AND)":[
        [P,"A",P],
        P
    ]
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


// check if an abstract proposition is a match for this specific proposition
// throw errors instead of returning false to get info about what doesnt match
type SymbolProps = { P:Proposition[],Q:Proposition[],R:Proposition[] }
function checkPropositionMatch(x:Proposition, eq:AbstractProposition): boolean {
    // Create new empty object to keep track of what abstract symbol a proposition is assigned to ensure 
    // the ones with the same one are identical
    let symbolProps:SymbolProps = { P:[], Q:[], R:[] };    
    let helper_result = _checkPropositionMatch_helper(x, eq, symbolProps);
    
    // Make sure all are equal within symbol
    for (let sym in symbolProps) {
        if (symbolProps[sym].length > 0) {
            for (let p in symbolProps[sym]) {
                if (!areEquivalentSymbols(p, symbolProps[sym][0])) {
                    throw new Error("Two propositions with the same symbol for this equivalence are not identical: \nA: "+
                    JSON.stringify(p)+"\nB: "+JSON.stringify(symbolProps[sym][0]));
                }
            }
        }
    }

    return helper_result;
}
function _checkPropositionMatch_helper(x:Proposition, eq:AbstractProposition, symbolProps:SymbolProps): boolean {

    let E_isBaseSymbol = typeof eq == 'symbol';
    let X_isBaseSymbol = typeof x == 'string';
    
    // An abstract base symbol matches any proposition
    // Also, store the associated proposition
    if (E_isBaseSymbol) { symbolProps[eq as symbol] = x; return true; }
    // If input is some base variable, but abstract is more complex, symbol cannot match
    if (X_isBaseSymbol) { throw new Error("Proposition is a base variable but equivalence is more complex."); }

    let E_isNeg = eq[0] == '-';
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





//try { checkPropositionMatch(source, [P,"A",P]); } catch(e) { console.log(e); }
try { checkPropositionMatch(source2, [P,"A",P]); } catch(e) { console.log(e); }

