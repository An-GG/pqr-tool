import { Proposition } from "./solver";
import keypress from 'keypress';

let target:Proposition = [ [["-", "q"], "->", ["-", "p"]], "->", ["p", "A", "p"]];



/**
 * Basic Interface:
 * - Use arrows to change proposition selected
 *  <- -> adjust working bit
 *  ^ v   adjust depth
 */
function cli() {
    let selection:PartitionSelection = [];
    let selected:Proposition = target; 
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
        try { selected = getSubproposition(target, newS); selection = newS; } catch(e) {
            nomove();
        }
    }
    function printSelection() {
        let selectedText = express_str(getSubproposition(target, selection));
        let around = express_str_around(target, selection);
        (process.stdout as any).clearLine();
        process.stdout.cursorTo(0);
        process.stdout.write(   "\x1b[0m\x1b[1m\x1b[37m" + around[0] + 
                                "\x1b[0m\x1b[1m\x1b[32m" + selectedText + 
                                "\x1b[0m\x1b[1m\x1b[37m" + around[1]);
    }

    process.stdin.setRawMode(true);
    process.stdin.resume();
    keypress(process.stdin);
    printSelection();

    process.stdin.on('keypress', function(ch, key) {
        // Exit with Ctrl-C
        if (key && key.ctrl && key.name == 'c') { process.stdin.pause(); }

        try {
            switch (key.name) {
                case "left": moveSelect(-1, "-"); break;
                case "right": moveSelect(1, "-"); break;
                case "up": moveSelect(1, "|"); break;
                case "down": moveSelect(-1, "|"); break;
            }
        } catch(e) {}

        printSelection();
    });

}
//cli();



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
