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
    if (typeof p == 'string') { return p; }
    if (typeof p[0] == 'string' && p[0] == '-') { return "-"+express_str(p[1]); }
    return "( " + express_str(p[0]) + " " + p[1] + " " + express_str(p[2])+" )";
}
function express_str_around(p:Proposition, target:PartitionSelection):string[] {
    let out = ["",""];
    if (target.length > 0) {
        let aroundForInner = express_str_around(getSubproposition(p, [target[0]]), target.slice(1));
        if (typeof p[0] == 'string' && p[0] == '-') {
            out[0] = "-" + aroundForInner[0];
            out[1] = aroundForInner[1];
        } else {
            if (target[0] == 0) {
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
