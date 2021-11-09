# Mutar
**Mu**table**T**yped**Ar**ray - _/mu'taɾ/, spanish for to change, mutate_

**Mutar** is a toolkit to interact with typed arrays and modify them (or let's say a kit to emulate modification) and a constructor for a special object. It is a very convenient way to handle binary data. If constructed, the array behaves pretty much as a regular array. You can concatenate, pop, shift, unshift... On top of that the type can be changed from - let's say - Uint8 to Float64. 

In reality _TypedArrays_ are not mutable in terms of growing and shrinking. To emulate mutability a new array with the desired properties is created. This comes to a price of course. Every time the array length "changes", a new TypedArray is allocated in memory. Keep that in mind when using it, if this is critical to you.

#### Endianness
**Mutar** objects are designed to be aware of endianness. If not specified, the the endianness of the system is used, which is most likely little endian. Despite this fact, sometimes data (e.g. network related) differ in its endianness. It is possible to store them in a **Mutar** object, interact with it but keep the given byte order. (Values which are added or got are converted to the according endianness). 

## Toolkit
If you want to work with an existing TypedArray, you can use **Mutar** to analyse and modify it. Let's for example take a Uint32Array which holds the integer **400**. A little remark: If you plan to do a lot of manipulation to a single array, you should strongly consider to use the [Mutar object](#Object). 

```js
const Uint32 = new Uint32Array([400]);
```
Mutar comes with some functions to analyse the given object. (Let us forget for a moment that we exactly know what kind of object it is).

### Analysis
```js
const Uint32 = new Uint32Array([400]);
const regularArray = [400];

// Test if is a TypedArray //
Mutar.isTypedArray(Uint32);                     // -> true
Mutar.isTypedArray(regularArray);               // -> false

// Get the type //
Mutar.getType(Uint32);                          // -> "Uint32Array"


// Test if array is of type xy //

// test for Uint32Array
Mutar.isTypeOf(Uint32, "Uint32Array");          // -> true

// you can also use the Uint32 constructor as input
Mutar.isTypeOf(Uint32, Uint32Array);            // -> true

// test for Int8Array (this time a shortcut for the type)
Mutar.isTypeOf(Uint32, "Int8");                 // -> false

// test the "wrong" type
Mutar.isTypeOf(regularArray, Uint32Array);      // -> false
```

Let's now take a look at the fun part: the modification.

### Modification
```js
// Again we are taking the Uint32Array of the Integer 400
// The individual bytes for this number are:
// [ 144, 1, 0, 0 ] (little endian byte order)

const Uint32 = new Uint32Array([400]);                      // -> Uint32Array(1)    [ 400 ]

// Easy start: create a copy (clone) of a TypedArray
// (changes on the clone will not affect the original)
const clone = Mutar.clone(Uint32);                          // -> Uint32Array(1)    [ 400 ]

// Concatenation of arrays (let's join the original, the clone and a fresh array)
const fresh = new Uint16Array([500, 600]);                  // -> Uint16Array(2)    [500, 600]
let concat = Mutar.concat(Uint32, clone, fresh);            // -> TypeError

// Seems like the objects needs to be converted before they fit together.
let freshUint32 = Mutar.convert(fresh, "Uint32");           // -> int32Array(1)     [ 39322100 ]

// Two Uint16 values fit in one Uint32 (or to be more clear:
// the underlying buffer has 4 integers [ 244, 1, 88, 2 ],
// which converts into one Uint32 integer), but this is not
// what we want in this case.
// Luckily we can convert in another mode -> "intMode"
freshUint32 = Mutar.convert(fresh, "Uint32", true);         // -> Uint32Array(2)    [500, 600]

// Now we can concat.
concat = Mutar.concat(Uint32, clone, freshUint32);          // -> Uint32Array(4)    [ 400, 400, 500, 600 ]

// If the conversions are that simple as in this case,
// we can tell the concat function to force conversion
// on the fly. By literally passing the string "force".
// Also the "intMode" can be activated by passing the
// string (by using "intMode", you don't have to pass
// "force" anymore, as the intention is clear, but it
// doesn't hurt either).
concat = Mutar.concat(concat, new Uint16Array([700]), "intMode");
                                                            // -> Uint32Array(4)    [ 400, 400, 500, 600, 700 ]

// Let's take a closer look at the type conversion.
// The focus is now on the regular mode

// conversion (e.g. BigInt64) 
const bigInt = Mutar.convert(concat, "BigInt");             // -> BigInt64Array(2)  [ 1717986918800n, 2576980378100n, 700n ]

// The original "concat" array has a byte length of 20, BingIntArrays
// byte lengths must devisable by 8. Mutar is using zero padding to
// make this fit (zeros are added to the end of the ArrayBuffer or at
// the beginning for big endian). So when you convert the BigInt back
// to Uint32 it looks like this.
let Uint32fromBigInt = Mutar.convert(bigInt, "Uint32");     // -> Uint32Array(5)    [ 400, 400, 500, 600, 700, 0 ]

// To remove this padded zero we can use the "trim" function
Uint32fromBigInt = Mutar.trim(bigInt);                      // -> Uint32Array(5)    [ 400, 400, 500, 600, 700 ]

// We can get rid of this zero also during conversion by setting
// the third param "trim" to true.
Uint32fromBigInt = Mutar.convert(bigInt, "Uint32", false, true);
                                                            // -> Uint32Array(5)    [ 400, 400, 500, 600, 700 ]

// Let us now remove the repetitive 400 and position 1
// (the function returns an array with the new typed array
// at position 0 and the detached value an position 1)
let cleanedUint32, detached;
[cleanedUint32, detached] = Mutar.detach(Uint32fromBigInt, 1);
                                                            // -> Uint32Array(4)    [ 400, 500, 600, 700 ], 400

// We can also insert
let insertedUint32, newlen;
[insertedUint32, newlen] = Mutar.insert(cleanedUint32, 2, 550);
                                                            // -> Uint32Array(5)    [ 400, 500, 550, 600, 700 ], 5

// Pop
let poppedUint32, popped;
[poppedUint32, popped] = Mutar.pop(insertedUint32);         // -> Uint32Array(4)    [ 400, 500, 550, 600 ], 700

// Push
let pushedUint32;
[pushedUint32, newLen] = Mutar.push(poppedUint32, 700, 800);
                                                            // -> Uint32Array(6)    [ 400, 500, 550, 600, 700, 800 ]

// Shift
let shiftedUint32, shifted;
[shiftedUint32, shifted] = Mutar.shift(pushedUint32);       // -> Uint32Array(5)    [ 500, 550, 600, 700, 800 ], 400

// Unshift
let unshiftedUint32, newLen;
[unshiftedUint32, shifted] = Mutar.unshift(shiftedUint32, 300, 400);       
                                                            // -> Uint32Array(7)    [ 300, 400, 500, 550, 600, 700, 800 ], 7

// Splice
let splicedUint32, slicedArr;
[splicedUint32, slicedArr] = Mutar.splice(unshiftedUint32, 2, 3, 450, 500, 550, 600, 650);
                                                            // -> Uint32Array(9)    [ 300, 400, 450,
                                                            //                        500, 550, 600,
                                                            //                        650, 700, 800 ],
                                                            //                      [ 500, 550, 600 ]



// trimming zero padding
// the two zeros at byte index 2 and 3 are know part
// a whole stream. The null bytes at the end of the array
// can still get trimmed. (You can get rid of them by
// setting the second argument to true, if you do so
// all zeros are getting purged. Be careful with that
// option.)
const trimmed = Mutar.trim(concat8);                // -> Uint8Array(6)     [ 144, 1, 0, 0, 244, 1 ]

// By going back to Uint32 the missing padding is added "again"
Mutar.convert(trimmed, Uint32Array)                 // -> Uint32Array(2)    [ 400, 500 ] | UI8 [ 144, 1, 0, 0, 244, 1, 0, 0]





// change a value of the array
Mutar.setAt(concat, 1, 500);                        // -> Uint32Array(2)    [ 400, 500 ]



```
