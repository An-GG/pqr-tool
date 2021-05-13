import { Proposition } from "./solver";

let target:Proposition = [["-", "q"], "->", ["-", "p"]];


/** 
 * the successive nth selection for proposition
 * 
 * starting from the first proposition at level 0, (which is selected initially
 * with a zero length array) 
 * the 0th proposition, then either 0 or 1, etc
 */
type PartitionSelection = number[]
function partitionedExpression(p:Proposition,n:PartitionSelection): string[] {
    let txt_before = "";
    let txt_main = "";
    let txt_after = "";

    let selectedProp = p;
    for (let s of n) {
        if (typeof selectedProp == 'string') {
            throw new Error("Proposition is a base symbol and has no subpropositions.");
        }
        if (typeof selectedProp[0] == 'string' && selectedProp[0] == '-') {
            if (s == 0) {
                txt_before += '-';
                txt_after = '' + txt_after;
                selectedProp = selectedProp[1];
            } else {
                throw new Error("Negator proposition has only 1 subproposition at index 0.");
            }
        }
        if (s == 0 || s == 1) {
            if (s == 0) {
                txt_before = txt_before + "( ";
                txt_after = " " + selectedProp[1] + " " + express_str(selectedProp[2] as any) + " )" + txt_after;
                selectedProp = selectedProp[0];
            } else {
                txt_before = txt_before + "( " + express_str(selectedProp[0] as any) + " " + selectedProp[1] + " ";
                txt_after = " )" + txt_after;
                selectedProp = selectedProp[2];
            }
        } else {
            throw new Error("Requested subproposition out of range.");
        }
    }

    txt_main = express_str(selectedProp);
    return [txt_before, txt_main, txt_after];
}

function countSubpropositions(p:Proposition):number {
    if (typeof p == 'string') { return 0; }
    if (typeof p[0] == 'string' && p[0] == '-') { return 1; }
    return 2;
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

function express_str(p:Proposition):string {
    console.log(typeof p);
    if (typeof p == 'string') { return p; }
    if (typeof p[0] == 'string' && p[0] == '-') { return "-"+express_str(p[1]); }
    return "( " + express_str(p[0]) + " " + p[1] + " " + express_str(p[2])+" )";
}

console.log(partitionedExpression(target, [0,0])); 