# Mutar
**Mu**table**T**yped**Ar**ray - _/mu'taɾ/, spanish for to change, mutate_

**Mutar** is a toolkit to interact with typed arrays and modify them (or let's say a kit to emulate modification) and a constructor for a special object. It is a very convenient way to handle binary data. If constructed, the array behaves pretty much as a regular array. You can concatenate, pop, shift, unshift... On top of that the type can be changed from - let's say - Uint8 to Float64. 

#### Mutability
In reality _TypedArrays_ are not mutable in terms of growing and shrinking. To emulate mutability a new array with the desired properties is created. This comes to a price of course. Every time the array length "changes", a new TypedArray is allocated in memory. Keep that in mind when using it, if this is critical to you.

#### Endianness
**Mutar** objects are designed to be aware of endianness. If not specified, the the endianness of the system is used, which is most likely little endian. Despite this fact, sometimes data (e.g. network related) differ in its endianness. It is possible to store them in a **Mutar** object, interact with it but keep the given byte order. (Values which are added or got are converted to the according endianness).

## Installation

### GitHub
```sh
git clone https://github.com/UmamiAppearance/MutarJS.git
```

### npm
```sh
nmp install mutar
```

## Builds
The GitHub repository has ready to use builds included. You can find them in [dist](https://github.com/UmamiAppearance/MutarJS/tree/main/dist). The npm package comes without pre build files. 

For building you have to run:

```sh
npm run build
``` 

Either way you have two builds available ([esm](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules) and [iife](https://developer.mozilla.org/en-US/docs/Glossary/IIFE)), plus a minified version of each. 
* ``Mutar.esm.js``
* ``Mutar.esm.min.js``
* ``Mutar.iife.js``
* ``Mutar.iife.min.js``


## Importing

### Node
```js
// common js
const Mutar = require("mutar");

// ES6 import
import Mutar from "mutar";
```

### Browser
```html
<!-- iife / classic script tag -->
<script src="Mutar.iife(.min).js"></script>
```

```js
// ES6
import Mutar from "./path/Mutar.esm(.min).js"
```

## Usage

### Toolkit
If you want to work with an existing TypedArray, you can use **Mutar** to analyse and modify it. Let's for example take a Uint32Array which holds the integer **400**. A little remark: If you plan to do a lot of manipulation to a single array, you should strongly consider to use the [Mutar Object](#Object).

```js
const Uint32 = new Uint32Array([400]);
```
Mutar comes with some functions to analyse the given object. (Let us forget for a moment that we exactly know what kind of object it is).

#### Analysis
```js
const Uint32 = new Uint32Array([400]);
const regularArray = [400];

// Test if is a TypedArray //
Mutar.isTypedArray(Uint32);                     // -> true
Mutar.isTypedArray(regularArray);               // -> false

// Get the type //
Mutar.getType(Uint32);                          // -> "Uint32Array"


// Test if array is of type foo //

// test for Uint32Array
Mutar.isTypeOf(Uint32, "Uint32Array");          // -> true

// you can also use the Uint32 constructor as input
Mutar.isTypeOf(Uint32, Uint32Array);            // -> true

// test for Int8Array (this time a shortcut for the type)
Mutar.isTypeOf(Uint32, "Int8");                 // -> false

// test the "wrong" type
Mutar.isTypeOf(regularArray, Uint32Array);      // -> false
```

Let's now take a look at the fun part: the _modification_.

#### Modification
One major focus of Mutar is to be aware of endianness. For simplicity, there is only a small section at the beginning of this chapter, that is going into this feature. The other here introduced functions are not using the opportunity to manipulate endianness, but that doesn't mean that it is not there. Every function, that manipulates the bytes has the possibility to set the integers in either little or big endian. If nothing is specified, the endianness of the system is getting used. 


```js
// Again we are taking the Uint32Array of the Integer 400
// The individual bytes for this number are:
// [ 144, 1, 0, 0 ] (little endian byte order)

const Uint32 = new Uint32Array([400]);                      // -> Uint32Array(1)    [ 400 ]

// Easy start: create a copy (clone) of a TypedArray
// (changes on the clone will not affect the original)
const clone = Mutar.clone(Uint32);                          // -> Uint32Array(1)    [ 400 ]

// Change endianness
Mutar.flipEndianness(clone);                                // -> Uint32Array(1)    [ 2415984640 ]

// Determine the endianness of the System
const littleEndian = Mutar.SYS_LITTLE_ENDIAN;               // -> true (most likely)
const bigEndian = !littleEndian;                            // -> false 

// Get the integer at index 0 (little or big endian is getting passed here,
// which is only done for universal correctness. Just pass true for little
// and false for big endian)
Mutar.at(Uint32, 0, littleEndian);                          // -> 400
Mutar.at(clone, 0, littleEndian);                           // -> 2415984640
Mutar.at(clone, 0, bigEndian);                              // -> 400

// Set single integers (Uint32 has the systems endianness, so no need to specify)
Mutar.setAt(Uint32, 0, 500);
Mutar.setAt(clone, 0, 500, bigEndian);

// Now let's set back the endianness of the clone and test if it is equal to
// the original Uint32
Uint32[0] === clone[0]                                      // -> false (500 === 4093706240)
Mutar.flipEndianness(clone);                                // -> Uint32Array(1)    [ 500 ]
Uint32[0] === clone[0]                                      // -> true

// As already mentioned, you have the ability to specify the endianness
// for almost every function. From now on it is no longer used, everything
// is done with the systems default endianness. Before we continue, let us 
// set back clone and original to 400.
Uint32[0] = 400;
clone[0] = 400;



// Concatenation of arrays (let's join the original, the clone and a fresh array)
const fresh = new Uint16Array([500, 600]);                  // -> Uint16Array(2)    [500, 600]
Mutar.concat(Uint32, clone, fresh);                         // -> TypeError

// Seems like the objects needs to be converted before they fit together.
let freshUint32 = Mutar.convert(fresh, "Uint32");           // -> int32Array(1)     [ 39322100 ]

// Two Uint16 values fit in one Uint32 (or to be more clear:
// the underlying buffer has 4 integers [ 244, 1, 88, 2 ],
// which converts into one Uint32 integer), but this is not
// what we want in this case.
// Luckily we can convert in another mode -> "intMode"
freshUint32 = Mutar.convert(fresh, "Uint32", true);         // -> Uint32Array(2)    [500, 600]

// Now we can concat.
let concat = Mutar.concat(Uint32, clone, freshUint32);       // -> Uint32Array(4)    [ 400, 400, 500, 600 ]

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
// byte lengths must be devisable by 8. Mutar is using zero padding to
// make this fit (zeros are added to the end of the ArrayBuffer or at
// the beginning for big endian). So when you convert the BigInt back
// to Uint32 it looks like this.
let Uint32fromBigInt = Mutar.convert(bigInt, "Uint32");     // -> Uint32Array(5)    [ 400, 400, 500, 600, 700, 0 ]

// To remove this padded zero we can use the "trim" function
Uint32fromBigInt = Mutar.trim(Uint32fromBigInt);            // -> Uint32Array(5)    [ 400, 400, 500, 600, 700 ]

// We can get rid of this zero also during conversion by setting
// the third param "trim" to be true.
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
                                                            // -> Uint32Array(6)    [ 400, 500, 550, 600, 700, 800 ], 6

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

// Create a Mutar object from a regular typed array
const mutarObj = Mutar.from(splicedUint32);

```

### Object

There are some opportunities for creating a **Mutar** object. One is, as shown right before, by calling the ``Mutar.from`` function. The default way looks like follows: 

#### Creating
```js
// Passing a regular array, plus the typed array function Uint32Array or string "Uint32Array"``
// or shortcut string "Uint32".
const mutarObj = new Mutar([300, 400, 450, 500, 550, 600, 650, 700, 800], Uint32Array);

// Passing a typed array (the type must not be specified)
const mutarObjFromTA = new Mutar(new Uint32Array([300, 400]));

// But type can be specified. In this case only the values matter, no longer the type of array
const mutarObjTAwithType = new Mutar(new Uint32Array([300, 400]), Uint16Array);

// Input can even be a string (which gets converted to a Uint8Array)
const mutarObjFromStr = new Mutar("Hello World!");

// Endianness matters (but is always the systems default if not specified)
// The third parameter of the constructor sets littleEndian of the object
// to true/false.
// Notice, that both objects look the same, but produce completely different
// results if you use the Mutar methods. The following examples are telling 
// Mutar: treat this is little, treat this as big endian. 
const mutarObjLE = new Mutar(new Uint32Array([300, 400]), null, true);
const mutarObjBE = new Mutar(new Uint32Array([300, 400]), null, false);

// If the values shall flip you can set another parameter, called "adjustEndianness"
const mutarObjBEadjust = new Mutar(new Uint32Array([300, 400]), null, false, true);
                                          // [738263040, 2415984640] 
```

#### Structure
Mutar objects have a pretty simple structure. The constructor sets:
 * ``littleEndian``
 * ``array``
 * ``view``

```
Mutar {
    littleEndian: true,
    array: Uint32Array(9) [
        300, 400, 450,
        500, 550, 600,
        650, 700, 800
    ],
    view: DataView {
        byteLength: 36,
        byteOffset: 0,
        buffer: ArrayBuffer {
            [Uint8Contents]: 
                < 2c 01 00 00 
                  90 01 00 00
                  c2 01 00 00
                  f4 01 00 00
                  26 02 00 00
                  58 02 00 00
                  8a 02 00 00
                  bc 02 00 00
                  20 03 00 00 >,
            byteLength: 36
        }
    }
}

```

#### Methods
We can interact directly with those children, but that is not very handy. There are plenty of methods callable from the root, which include all methods of a typed array and regular arrays (with the exception of flat & flatMap), plus the custom methods of the toolkit.  
Even though the object has far more methods than the toolkit provides, there is much less to explain. The difference is, that the object holds the array which gets modified, it is therefore not necessary to always store the output of the method. And also we do not have to hand over a typed array (which will be done for you and will always be ``mutarObj.array``). Let's exemplary take a look at some methods.

```js
// Let us set again the array, with deliberately setting the endianness to be true.
// (Which is redundant, as it is set to the systems endianness by default, but let
// us keep this examples universally correct).
const mutarObj = new Mutar([300, 400, 450, 500, 550, 600, 650, 700, 800], Uint32Array, true); 

// Pop as method
mutarObj.pop();                                     // -> 800

// Push as method
mutarObj.push(750);                                 // -> 9

// Concat also behaves like the regular array method 
mutarObj.concat(new Uint32Array([900, 1000]));      // -> returns a mutar object with the array [... 700, 800, 1000]

// You can btw also concat and set/save the concatenated array at mutarObj.array, which
// saves the step of storing the concatenated return object.
mutarObj.conset(new Uint32Array([900, 1000]));

// And this list goes on, just apply your knowledge about regular arrays
// and typed arrays. If you are not interested in manipulating the endianness,
// that is all you need to know.

// Let us know look at the particularities.
// As already displayed, the object has the property littleEndian. That
// means, that every function call is done with this setting, if it is
// not overwritten, which totally is possible. See for example:

mutarObj.shift(false);                              // -> 738263040

// The value 300 was converted, as we explicitly asked for it. 
// The last object of almost every function takes this endianness
// bool. As shift usually takes no arguments, there is only this 
// parameter left. But lets us look at an example that takes many 
// arguments. The littleEndian bool is always at the very end.

mutarObj.splice(-2, 2, 800, 850, false);            // -> Uint32Array(2) [ 900, 1000 ]

// The last argument has set the endianness to false, which we can see
// if we look at the array
mutarObj.toString();                                // -> '400,450,500,550,600,650,700,750,537067520,1375928320'

// We can also tell the ``toString`` method to flip the endianness

mutarObj.toString(false);                           // -> '...3154247680,3993108480,800,850'

// At the very end we can now see our two values we added with the
// splice call as BE flipped back again. But lets us know clean up
// this mixed mess. First we call the detach method to remove the
// last but one value and tell ist to use BE.
mutarObj.detach(-2, false);                         // -> 800

// Now the pop method for the removal of the last value without 
// specification
mutarObj.pop();                                     // -> 1375928320

// Let us now flip the endianness all together and look what happens
mutarObj.flipEndianness();                          // -> Uint32Array(8) [ 2415984640, ..., 3993108480 ]

// The values have all flipped as well as the littleEndian value.
// The result is, that if we don't pass any endian bool manually.
// the methods now work with be. If we call the "at" function, we
// see the actual value, translated to the endianness of our system.

mutarObj.at(0);                                     // -> 400
mutarObj.array.at(0);                               // -> 2415984640

// The big advantage is, that we now don't have to bother about this.
// Algorithms can use the systems endianness Mutar translates it.
// Lets create a little function and pass it to the map function
// to demonstrate this.

const demoFN = (val) => {
    const newVal = val*2;
    console.log(newVal);
    return newVal;
} 

mutarObj.map(demoFN);
/* 800
   900
  1000
  1100
  1200
  1300
  1400
  1500
  
  Uint32Array(8) [
    537067520, 2214789120,
   3892510720, 1275330560,
   2953052160,  335872000,
   2013593600, 3691315200
 ]
*/

// The console shows the actual values, the array shows the values stored in BE byte order.
```

##### Available Children
_getters:_
* ``obj.BYTES_PER_ELEMENT``
* ``obj.SYS_LITTLE_ENDIAN``
* ``obj.buffer``
* ``obj.byteLength``
* ``obj.byteOffset``
* ``obj.length``
* ``obj.type``

_methods:_
* ``obj.at``
* ``obj.clone``
* ``obj.concat``
* ``obj.conset``
* ``obj.convert``
* ``obj.copyWithin``
* ``obj.detach``
* ``obj.entries``
* ``obj.every``
* ``obj.extractArrayClone``
* ``obj.fill``
* ``obj.filter``
* ``obj.find``
* ``obj.findIndex``
* ``obj.flipEndianness``
* ``obj.forEach``
* ``obj.includes``
* ``obj.indexOf``
* ``obj.insert``
* ``obj.join``
* ``obj.keys``
* ``obj.lastIndexOf``
* ``obj.map``
* ``obj.pop``
* ``obj.push``
* ``obj.reduce``
* ``obj.reduceRight``
* ``obj.reverse``
* ``obj.set``
* ``obj.setAt``
* ``obj.shift``
* ``obj.slice``
* ``obj.some``
* ``obj.sort``
* ``obj.splice``
* ``obj.subarray``
* ``obj.toLocaleString``
* ``obj.toString``
* ``obj.trim``
* ``obj.unshift``
* ``obj.updateArray``
* ``obj.values``
