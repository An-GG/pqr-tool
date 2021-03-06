import { AbstractProposition, equivalences, GeneralProposition, getLegalEquivalences, performEquivalenceSwap, Proposition } from "./solver";
import keypress from 'keypress';

let activeProp:Proposition = [[["-","q"],"A",["p","->","q"]],"->",["-","p"]];



/**
 * Basic Interface:
 * - Use arrows to change proposition selected
 *  <- -> adjust working bit
 *  ^ v   adjust depth
 */
function cli() {
    
    function nomove() { throw new Error("Can't move in that direction."); }
    function moveSelect(n:number, axis:"|"|"-") {
        let newS:PartitionSelection = JSON.parse(JSON.stringify(selection));
        if (axis == "-") {
            if (selection.length == 0) { nomove(); }
            newS[newS.length - 1]+=n;
        } else {
            let newlen = selection.length + n;
            if (newlen < 0) { nomove(); }
            if (newlen < selection.length) {
                while (newS.length > newlen) {
                    newS.pop();
                }
            } else {
                while (newS.length < newlen) {
                    newS.push(0);
                }
            }
        }
        // Do validity check
        try { selectedProp = getSubproposition(activeProp, newS); selection = newS; } catch(e) {
            nomove();
        }
    }
    function setLineTo(s:string) {
        (process.stdout as any).clearLine();
        process.stdout.cursorTo(0);
        process.stdout.write(s);
    }

    function printSelection() {
        let selectedText = express_str(getSubproposition(activeProp, selection));
        let around = express_str_around(activeProp, selection);
        (process.stdout as any).clearLine();
        process.stdout.cursorTo(0);
        process.stdout.write(   "\x1b[0m\x1b[1m\x1b[37m" + around[0] + 
                                "\x1b[0m\x1b[1m\x1b[32m" + selectedText + 
                                "\x1b[0m\x1b[1m\x1b[37m" + around[1]);
    }


    let currentMode : "SELECT_PROP" | "SELECT_EQ" = "SELECT_PROP";
    let selection:PartitionSelection = [];
    let selectedProp:Proposition = activeProp; 
    let selectedEqString = "";
    
    process.stdin.setRawMode(true);
    process.stdin.resume();
    keypress(process.stdin);
    printSelection();
    process.stdin.on('keypress', function(ch, key) {
        // Exit with Ctrl-C
        if (key && key.ctrl && key.name == 'c') { process.stdin.pause(); }
        
        // There could be 1 of 2 modes: 
        // 1. selecting proposition
        // 2. selecting equivalence to use
        if (currentMode == "SELECT_PROP") {
            try {
                switch (key.name) {
                    case "left": moveSelect(-1, "-"); break;
                    case "right": moveSelect(1, "-"); break;
                    case "up": moveSelect(1, "|"); break;
                    case "down": moveSelect(-1, "|"); break;
                }
                printSelection();
            } catch(e) {}

            if (key.name == "enter" || key.name == "return") {
                // Selected current proposition
                console.log("\n\nSelected:");
                printSelection();
                console.log("\n");
                currentMode = "SELECT_EQ";
                selectedEqString = "";

                console.log("Select Equivalence:");
                console.table(["Cancel"].concat(getLegalEquivalences(selectedProp)));
                console.log("\n");
            }
            
        } else {
            let nums = "1234567890";
            if (ch && nums.includes(ch)) {
                selectedEqString += ch;
                setLineTo(selectedEqString);
            } else if (key && key.name == "backspace") {
                if (selectedEqString.length > 0) {
                    selectedEqString = selectedEqString.substring(0, selectedEqString.length - 1);
                }
                setLineTo(selectedEqString);
            } else if (key && key.name == "return") {
                // Selected Eq
                let eqN = parseInt(selectedEqString) - 1;
                if (eqN == -1) {
                    console.log("\nActive Proposition:\n")
                    currentMode = "SELECT_PROP";
                    printSelection();
                    return;
                }

                let legalEqName = getLegalEquivalences(selectedProp)[eqN];
                console.log("\n\nSelected: "+selectedEqString+" "+legalEqName);
                
                let eq = equivalences[legalEqName];
                console.log(express_abstract_equivalence_str(eq[0]) + " = " + express_abstract_equivalence_str(eq[1]) + "\n");
                
                let newprop = performEquivalenceSwap(selectedProp, eq);
                // Swap Selection
                let swapped = swapSubpropositionWith(activeProp, selection, newprop);

                let before = express_str_around(activeProp, selection);
                let after = express_str_around(swapped, selection);
                
                // Switch modes
                selection = [];
                activeProp = swapped;
                selectedProp = activeProp;
                selectedEqString = "";
                currentMode = "SELECT_PROP";

                console.log("Active Proposition:\n")
                printSelection();
                

            }
        }
        
    });

}
cli();



/** 
 * the successive nth selection for proposition
 * 
 * starting from the first proposition at level 0, (which is selected initially
 * with a zero length array) 
 * the 0th proposition, then either 0 or 1, etc
 */
type PartitionSelection = number[]

function countSubpropositions(p:Proposition):number {
    if (typeof p == 'string') { return 0; }
    if (typeof p[0] == 'string' && p[0] == '-') { return 1; }
    return 2;
}

type BasicPropType = "BASE_SYMBOL" | "AXB" | "XA"
function getPropositionType(p:GeneralProposition<symbol | string>): BasicPropType {
    if (typeof p == 'string' || typeof p == 'symbol') {
        return "BASE_SYMBOL";
    }
    if (typeof p[0] == 'string' && p[0] == '-') { 
        return "XA";
    }
    if (p.length == 3 && typeof p[1] == 'string') {
        return "AXB";
    }
    throw new Error('Unidentifiable: ' + JSON.stringify(p));
}

function getSubproposition(p:Proposition, n:PartitionSelection):Proposition {
    if (n.length == 0) { return p; }
    if (typeof p == 'string') {
        throw new Error("Proposition is a base symbol and has no subpropositions.");
    }
    if (typeof p[0] == 'string' && p[0] == '-') { 
        if (n[0] == 0) {
            return getSubproposition(p[1], n.slice(1));
        } else {
            throw new Error("Negator proposition has only 1 subproposition at index 0.");
        }
    }
    if (n[0] == 0 || n[0] == 1) {
        if (n[0] == 0) { return getSubproposition(p[0], n.slice(1)) }
        else { return getSubproposition(p[2], n.slice(1)) }
    } else {
        throw new Error("Requested subproposition out of range.");
    }
}

function swapSubpropositionWith(prop:Proposition, at:PartitionSelection, swap:Proposition): Proposition {
    if (at.length == 0) { return swap; }
    let p : typeof prop = JSON.parse(JSON.stringify(prop));
    let ptype = getPropositionType(p);
    if (ptype == 'BASE_SYMBOL') {
        throw new Error("Proposition is a base symbol and has no subpropositions.");
    } else if (ptype == 'AXB') {
        if (at[0] == 0) {
            at.shift();
            return [swapSubpropositionWith(p[0], at, swap), p[1], p[2]] as any;
        } else if (at[0] == 1) {
            at.shift();
            return [p[0], p[1], swapSubpropositionWith(p[2], at, swap)] as any;
        }
    } else {
        if (at[0] == 0) {
            at.shift();
            return [p[0], swapSubpropositionWith(p[1], at, swap)] as any;
        } else if (at[0] == 1) {
            throw new Error("Negator proposition has only 1 subproposition at index 0.");
        }
    }
}


export function express_str(p:Proposition):string {
    if (typeof p == 'string') { return p; }
    if (typeof p[0] == 'string' && p[0] == '-') { return "-"+express_str(p[1]); }
    return "( " + express_str(p[0]) + " " + p[1] + " " + express_str(p[2])+" )";
}
function express_str_around(p:Proposition, selection:PartitionSelection):string[] {
    let out = ["",""];
    if (selection.length > 0) {
        let aroundForInner = express_str_around(getSubproposition(p, [selection[0]]), selection.slice(1));
        if (typeof p[0] == 'string' && p[0] == '-') {
            out[0] = "-" + aroundForInner[0];
            out[1] = aroundForInner[1];
        } else {
            if (selection[0] == 0) {
                out[0] = "( " + aroundForInner[0];
                out[1] = aroundForInner[1]+" "+p[1]+" "+express_str(p[2])+" )";
            } else {
                out[0] = "( "+express_str(p[0])+" "+p[1]+" "+aroundForInner[0];
                out[1] = aroundForInner[1] + " )";
            }
        }
    }
    return out;
}
function convert_abstractprop_stringprop(p:AbstractProposition): Proposition {
    if (typeof p == 'string') { return p; }
    if (typeof p == 'symbol') { return p.description; } 
    let normal = [];
    for (let item of p) {
        if (typeof item == 'string') { normal.push(item); }
        if (typeof item == 'symbol') { normal.push(item.description); } 
        if (typeof item == 'object') { normal.push(express_abstract_equivalence_str(item)); }
    }
    return normal as any;
}

export function express_abstract_equivalence_str(p:AbstractProposition):string {
    return express_str(convert_abstractprop_stringprop(p));
}