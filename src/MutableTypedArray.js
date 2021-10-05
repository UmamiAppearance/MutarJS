/*
 * [MutableTypedArray]{@link https://github.com/UmamiAppearance/MutableTypedArrayJS}
 *
 * @version 0.1.0
 * @author UmamiAppearance [mail@umamiappearance.eu]
 * @license GPL-3.0
 */
 

// Object which contains all possible TypedArrays
// and it's constructor
const ArrayTypes = {
    Int8Array: Int8Array,
    Uint8Array: Uint8Array,
    Uint8ClampedArray: Uint8ClampedArray,
    Int16Array: Int16Array,
    Uint16Array: Uint16Array,
    Int32Array: Int32Array,
    Uint32Array: Uint32Array,
    Float32Array: Float32Array,
    Float64Array: Float64Array,
    BigInt64Array: BigInt64Array,
    BigUint64Array: BigUint64Array
}

// Test endianness 
const bigEndian = (() => {  
    const testInt = new Uint16Array([1]);
    const byteRepresentation = new Uint8Array(testInt.buffer);
    return Boolean(byteRepresentation[1]);
})();


class MTA {
    /*
        Main class. It is both toolkit to interact with typed arrays and 
        "modify" them and a constructor of a special object. Or  let's
        say a kit to emulate modification. In Fact each time a  new array
        is created. 
        This comes to a price of course. Each time the array "changes",
        a new array is allocated in memory. This program is simply not
        suitable to handle big amounts of data. "Big amount" is relative, 
        but lets say if your program is using a lot of the available memory,
        you should consider other solutions.
        If this is not the case, this is a very convenient way to handle
        binary data. If constructed, the array behaves pretty much as a 
        regular array. You can concatenate, pop, shift, unshift...
        On top of that the type can be changed from - let's say - Uint8 to 
        Float64. Also zero padding can get trimmed. 
    */

    constructor(input, type) {
        /*
            Creates a special object. The actual array is locate
            at obj.array, all methods are available at top level.
            Those are all available methods for typed arrays and
            regular arrays. Plus some bonus features.
            
            @input: Can be a TypedArray, a string or buffer and regular array
            @type: A string that needs to be specified for buffer and regular arrayS
        */

        // The actual object, which is returned after construction.
        const MTAObj = {
            set arraySetter(val) {
                this.array = val;
                this.buffer = val.buffer;
                this.byteLength = val.byteLength;
                this.byteOffset = val.byteOffset;
                this.length = this.array.length;
                this.view = new DataView(val.buffer);
            },
            type: null,
            typeConstructor: null,
        }

        // Strings are automatically converted to a Uint8Array.
        if (typeof(input) === "string") {
            input = new TextEncoder().encode(input);
        }
        
        // If the input is a TypedArray all information can
        // get read from that object.
        if (ArrayBuffer.isView(input)) {
            MTAObj.arraySetter = input;
            MTAObj.type = input.constructor.name;
            MTAObj.typeConstructor = ArrayTypes[MTAObj.type];
        
        // If not the type must be specified and a new typed
        // array gets constructed based on the given information.
        } else {
            let error = true;
            if (type) {
                type = MTA.typeFromInput(type);
                MTAObj.type = type;
                MTAObj.typeConstructor = ArrayTypes[type];
                if (input instanceof ArrayBuffer || Array.isArray(input)) {
                    MTAObj.arraySetter = new MTAObj.typeConstructor(input);
                    error = false;
                }
            }
            if (error) throw new TypeError("For Array and ArrayBuffer the type needs to be specified as a second argument.");
        }

        // Append all methods for interaction
        this.appendMethods(MTAObj);
        
        return MTAObj;
    }

    
    // Static methods. To use MTA as a toolkit for 
    // interacting with typed arrays.

    static typeFromInput(type) {
        // Extract the type from a TypedArray constructor

        if (typeof(type) === "function") {
            type = type.name;
        }
        if (!(type in ArrayTypes)) {
            throw new TypeError(`Unknown type: ${type}`);
        }
        return type;
    }

    static getType(obj) {
        // Returns the name of the constructor (Uint8Array, Int16Array, ...)
        return obj.constructor.name;
    }
    
    static isTypedArray(obj) {
        // Test if object is a typed array
        return obj.constructor.name in ArrayTypes;
    }

    static isTypeOf(obj, type) {
        // Test if array is of type xy
        return obj.constructor.name === type;
    }

    static concat(objA, objB) {
        // Concatenates two typed array and returns
        // a combined array.

        if (objA.constructor.name !== objB.constructor.name) {
            throw new TypeError(`You are trying to concatenate two different types of arrays ('${objA.constructor.name}' and '${objB.constructor.name}')\nThis can only be done by converting them into the same type first.`);
        }
        const newArray = new ArrayTypes[objA.constructor.name](objA.length + objB.length);
        newArray.set(objA);
        newArray.set(objB, objA.length);
        return newArray;
    }

    static convert(obj, type, trim=false, view=null) {
        // Converts a given TypedArray to another type.
        // If the new type has less bytes grouped, it is
        // Possible to trim leftover zero padding. If a
        // view is already at hand it can get passed too.

        type = MTA.typeFromInput(type);
        const byteLen = obj.byteLength;
        const byteDiff = byteLen % ArrayTypes[type].BYTES_PER_ELEMENT;
        
        let newArray;

        if (!byteDiff) {
            newArray = new ArrayTypes[type](obj.buffer);
            if (trim) newArray = MTA.trim(newArray);
        } else {
            const missingBytes = ArrayTypes[type].BYTES_PER_ELEMENT - byteDiff;
            const newLen = byteLen + missingBytes;
            if (!view) view = new DataView(obj.buffer);
            let Uint8 = new Uint8Array(newLen);
            const start = (bigEndian) ? missingBytes : 0;
            for (let i=0, l=obj.byteLength; i<l; i++) {
                Uint8[i+start] = view.getUint8(i);
            }
            newArray = new ArrayTypes[type](Uint8.buffer);
        }

        return newArray;
    }

    static pushTo(obj, b) {
        // Pushes one byte to the end of a given array.

        const newArray = new ArrayTypes[obj.constructor.name].fn(obj.length + 1);
        newArray.set(obj);
        newArray[obj.length] = b;
        return newArray;
    }

    static popFrom(obj) {
        // Removes one byte from a given array.
        // Returns the new array and the removed
        // byte.

        return [obj.slice(0, -1), obj.at(-1)];
    }

    static unshiftTo(obj, b) {
        // Unshifts one byte ro a given array.

        const newArray = new ArrayTypes[obj.constructor.name](obj.length + 1);
        newArray.set(obj, 1);
        newArray[0] = b;
        return newArray;
    }

    static shiftFrom(obj) {
        // Shifts one byte from a given array
        // Returns the new array and the removed
        // byte.

        return [obj.slice(1), obj.at(0)];
    }

    static trim(obj) {
        // Trims null bytes from the given array and returns 
        // a new array. Only padded zeros are getting removed
        // respecting the endianness.
        // Example:
        // Integer '400'  binary '110010000'
        // As a Uint32Array: 'Uint32Array(1) [ 400 ]'
        //     -> [00000000000000000000000110010000]
        // As a Uint8Array (big endian):
        // Uint8Array(4) 
        //     [       0,       0,       1,     144]
        //  -> [00000000 00000000 00000001 10010000]
        //
        // As you can see: the first two bytes are holding
        // no information and can get trimmed without losing
        // information.
        // In little endian it is the same, but the oder is
        // flipped. 
        //   -> [10010000 00000001 00000000 00000000]
        // Here the last to bytes gan get trimmed.
        
        function giveBack(bytes, bytesPerElem) {
            // The trimming below removes all null bytes,
            // but for all types > (U)int8 zero padding
            // a necessity. The actual trimming is done
            // via index keys. This functions sets the 
            // index back to a legit value.

            let adder = 0;
            while (bytes % bytesPerElem) {
                bytes++;
                adder++;
            }
            return adder;
        }

        const type = obj.constructor.name;
        const bytesPerElem = obj.constructor.BYTES_PER_ELEMENT;
        const isGrouped = (bytesPerElem > 1);
        
        // Set a view that is able to look at single bytes
        // (If this is not already the case) 
        let singleBytesView = (isGrouped) ? new Uint8Array(obj.buffer) : obj;

        // Set initial start-end index values 
        const absEnd = obj.byteLength-1;
        let end = absEnd;
        let start = 0;

        // Look at the right hand side for big endian
        // and left hand for little endian. 
        if (bigEndian) {
            for (start; start<=end; start++) {
                if (singleBytesView[start]) {
                    break;
                }
            }
            if (isGrouped) start += giveBack(end-start+1, bytesPerElem);
        } else {
            for (end; end>=0; end--) {
                if (singleBytesView[end]) {
                    break;
                }
            }
            if (isGrouped) end += giveBack(end-start+1, bytesPerElem);
        }

        // Only construct a new array if changes are possible
        if (start > 0 || end < absEnd) {
            singleBytesView = singleBytesView.slice(start, end+1);
            obj = new ArrayTypes[type](singleBytesView.buffer);
        }
        return obj;
    }


    // Methods that are appended to the obj, called 
    // by the constructor. The obj methods are using 
    // the static methods

    appendMethods(obj) {

        obj.concat = (arr) => {
            const array = MTA.concat(obj.array, arr);
            return new MTA(array);
        };

        // concat and set the array to the concatenated array.
        obj.conset = (arr) => obj.arraySetter = obj.concat(arr).array;

        obj.convert = (type, trim=false) => obj.arraySetter = MTA.convert(obj, type, trim, obj.view);

        obj.push = (b) => {
            obj.arraySetter = MTA.pushTo(obj.array, b);
            return obj.array.at(-1);
        };

        obj.pop = () => {
            let popped;
            [obj.arraySetter, popped] = MTA.popFrom(obj.array);
            return popped;
        };

        obj.unshift = (b) => {
            obj.arraySetter = MTA.unshiftTo(obj.array, b);
            return obj.array[0];
        };

        obj.shift = () => {
            let shifted;
            [obj.arraySetter, shifted] = MTA.shiftFrom(obj.array);
            return shifted;
        };

        obj.trim = () => obj.arraySetter = MTA.trim(obj.array);

        // make build in methods accessible at top level
        obj.at = (...args) => obj.array.at(...args);
        obj.copyWithin = (...args) => obj.array.copyWithin(...args);
        obj.entries = (...args) => obj.array.entries(...args);
        obj.every = (...args) => obj.array.every(...args);
        obj.fill = (...args) => obj.array.fill(...args);
        obj.filter = (...args) => obj.array.filter(...args);
        obj.find = (...args) => obj.array.find(...args);
        obj.findIndex = (...args) => obj.array.findIndex(...args);
        obj.forEach = (...args) => obj.array.forEach(...args);
        obj.includes = (...args) => obj.array.includes(...args);
        obj.indexOf = (...args) => obj.array.indexOf(...args);
        obj.join = (...args) => obj.array.join(...args);
        obj.keys = (...args) => obj.array.keys(...args);
        obj.lastIndexOf = (...args) => obj.array.lastIndexOf(...args);
        obj.map = (...args) => obj.array.map(...args);
        obj.reduce = (...args) => obj.array.reduce(...args);
        obj.reduceRight = (...args) => obj.array.reduceRight(...args);
        obj.reverse = (...args) => obj.array.reverse(...args);
        obj.set = (...args) => obj.array.set(...args);
        obj.slice = (...args) => obj.array.slice(...args);
        obj.some = (...args) => obj.array.some(...args);
        obj.sort = (...args) => obj.array.sort(...args);
        obj.subarray = (...args) => obj.array.subarray(...args);
        obj.values = (...args) => obj.array.values(...args);
    }
}

export default MTA
