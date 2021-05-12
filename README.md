# pqr-tool

### low line-count tool to play around with discrete math propositions

Setup: clone & run `npm i`



### Express a proposition using `express()`
```ts
let out_set = [
    // (p∨q)→(p∧q)
    express([[p,"V",q],"->",[p,"A",q]]),
]
```
Due to some funny business you also need to copy paste this into an array right under it called key_set
```ts
let key_set: any[] = [
    express([[p,"V",q],"->",[p,"A",q]]),
]
```



### Compile `pq.ts` and run with node 
typescript is required
```bash
$ tsc pq.ts && node pq.js
┌───┬───┬───┬───────────┬───────────┬────────────────────────────┐
│ p │ q │ r │ ( p V q ) │ ( p A q ) │ ( ( p V q ) -> ( p A q ) ) │
├───┼───┼───┼───────────┼───────────┼────────────────────────────┤
│ F │ F │ F │         F │         F │                          T │
│ F │ F │ T │         F │         F │                          T │
│ F │ T │ F │         T │         F │                          F │
│ F │ T │ T │         T │         F │                          F │
│ T │ F │ F │         T │         F │                          F │
│ T │ F │ T │         T │         F │                          F │
│ T │ T │ F │         T │         T │                          T │
│ T │ T │ T │         T │         T │                          T │
└───┴───┴───┴───────────┴───────────┴────────────────────────────┘
```



### Add an arbitrary number of input variables
Update these lines to change # of variables, your references, and name they are printed with
```ts
let nvars = 7;
```
```ts
let [p, q, r, s, t, u, v] = in_set;
let letters = ["p", "q", "r", "s", "t", "u", "v"];
```


