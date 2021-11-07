# Mutar
**Mu**table**T**yped**Ar**ray - _/mu'taɾ/, spanish for to change, mutate_

**Mutar** is a toolkit to interact with typed arrays and modify them (or let's say a kit to emulate modification) and a constructor for a special object. It is a very convenient way to handle binary data. If constructed, the array behaves pretty much as a regular array. You can concatenate, pop, shift, unshift... On top of that the type can be changed from - let's say - Uint8 to Float64. 

In reality _TypedArrays_ are not mutable in terms of growing and shrinking. To emulate mutability a new array with the desired properties is created. This comes to a price of course. Every time the array length "changes", a new TypedArray is allocated in memory. Keep that in mind when using it, if this is critical to you.

#### Endianness
**Mutar** objects are designed to be aware of endianness. If not specified, the the endianness of the system is used, which is most likely little endian. Despite this fact, sometimes data (e.g. network related) differ in its endianness. It is possible to store them in a **Mutar** object, interact with it but keep the given byte order. (Values which are added or got are converted to the according endianness). 

## Toolkit
If you want to work with an existing TypedArray, you can use **Mutar** to analyse and modify it. Let's for example take a Uint32Array for the integer **400**.

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

// Seems like the objects need to be converted before they fit together.
// But this can be forced and done in one step in this case (if you want
// more control, do the conversion in separate steps before).

concat = Mutar.concat(Uint32, clone, fresh, "force");       // -> Uint32Array(3)    [ 400, 400, 39322100 ]

// Yeah, two Uint16 values fit in one Uint32, but this is not what we want in this case
// Luckily we can convert in another mode -> "intMode"

concat = Mutar.concat(Uint32, clone, fresh, "force", "intMode");
                                                            // -> Uint32Array(3)    [ 400, 400, 500, 600 ]

// Bingo. Let's take a closer look at the type conversion.

// conversion (e.g. BigInt64)
const bigInt = Mutar.convert(concat, "BigInt");             // -> BigInt64Array(2)  [ 1717986918800n, 2576980378100n ]

// converting to individual bytes
const concat8 = Mutar.convert(bigInt, "Uint8");             // -> Unt8Array(8)      [ 144, 1, 0, 0, 244, 1, 0, 0]

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
