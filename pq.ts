import { printTable } from "console-table-printer";

let nvars = 3;
function table (in_set:boolean[]): {} {
    let [p, q, r] = in_set;
    let letters = ["p", "q", "r"];

    strMode = false;
    let out_set = [
        express(p),
        express(q),
        express(r),
        express([p,"->",q]),
        express([["-",p],"->",r]),
        express([[p,"->",q],"A",[["-",p],"->",r]])
    ].map(x => x ? "T" : "F");

    strMode = true;
    [p, q, r] = letters as any;
    let key_set: any[] = [
        express(p),
        express(q),
        express(r),
        express([p,"->",q]),
        express([["-",p],"->",r]),
        express([[p,"->",q],"A",[["-",p],"->",r]])
    ];

    let out = {};
    for (let i=0; i<key_set.length; i++) {
        out[key_set[i]] = out_set[i];
    }

    return out;
}

















let OP : { [k:string]:(a:boolean, b:boolean)=>boolean } = {
    imp: (a,b)=>(!a)||(a && b),
    and: (a,b)=>a&&b,
    or: (a,b)=>a||b
}


type PropOp = "->" | "A" | "V"
type Proposition = boolean | [Proposition, PropOp, Proposition] | ["-", Proposition]
type PropString = string | [PropString, PropOp, PropString]



let strMode = false;

function express_str(p:PropString):string {
    if (typeof p == "string") {
        return p;
    }
    if (p[0] == "-") {
        return "-"+express_str(p[1]);
    }
    return "( " + express_str(p[0]) + " " + p[1] + " " + express_str(p[2])+" )";
}

function express(p:Proposition):boolean {

    if (strMode) { return express_str(p as any) as any; }

    if (typeof p == "boolean") {
        return p;
    }
    if (p[0] == "-") {
        return !express(p[1]);
    }
    switch (p[1]) {
        case "->": return OP.imp(express(p[0]),express(p[2]));
        case "V": return OP.or(express(p[0]),express(p[2]));
        case "A": return OP.and(express(p[0]),express(p[2]));
    }
    throw new Error("Unexpected Proposition: " + p);
}




let results = [];

function runner() {
    let n = Math.pow(2, nvars);
    for (let i = 0; i < n; i++) {
        let s = i.toString(2);
        while (s.length < nvars) { s = "0" + s }
        
        let b_arr = s.split("").map(x => x == "1");
        let r = table(b_arr);
        results.push(r);
    }
}


runner();

printTable(results);


