/*
 * [Mutar]{@link https://github.com/UmamiAppearance/MutableTypedArrayJS}
 *
 * @version 0.1.0
 * @author UmamiAppearance [mail@umamiappearance.eu]
 * @license GPL-3.0
 */

/* eslint-disable prefer-destructuring */

const Utils = {
    getSysEndianness: () => {
        /* 
            Test endianness:
            Uint16Array: Uint16Array(1) [ 1 ]
            Binary:       [00000000 00000001]
            Uint8 (b.end.)              [0 1]
            Uint8 (l.end.)              [1 0]

            Looking at index 0 shows 0 for
            big endian and 1 for little endian
        */

        const testInt = new Uint16Array([1]);
        const byteRepresentation = new Uint8Array(testInt.buffer);
        return Boolean(byteRepresentation[0]);
    },

    ArrayTypes: {
        /*
            Object which contains all possible TypedArrays
            and it's constructor
        */

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
    },

    ArrayShortCuts: {
        Int8: "Int8Array",
        Uint8: "Uint8Array",
        Clamped: "Uint8ClampedArray",
        Int16: "Int16Array",
        Uint16: "Uint16Array",
        Int32: "Int32Array",
        Uint32: "Uint32Array",
        Float32: "Float32Array",
        Float64: "Float64Array",
        BigInt: "BigInt64Array",
        BigUint: "BigUint64Array"
    },

    ViewMethods: {
        Int8Array: {
            get: "getInt8",
            set: "setInt8"
        },
        Uint8Array: {
            get: "getUint8",
            set: "setUint8"
        },
        Uint8ClampedArray: {
            get: "getUint8",
            set: "setUint8"
        },  
        Int16Array: {
            get: "getInt16",
            set: "setInt16"
        },
        Uint16Array: {
            get: "getUint16",
            set: "setUint16",
        },
        Int32Array: {
            get: "getInt32",
            set: "setInt32"
        },
        Uint32Array: {
            get: "getUint32",
            set: "setUint32"
        },
        Float32Array: {
            get: "getFloat32",
            set: "setFloat32"
        },
        Float64Array: {
            get: "getFloat64",
            set: "setFloat64"
        },
        BigInt64Array: {
            get: "getBigInt64",
            set: "setBigInt64"
        },
        BigUint64Array: {
            get: "getBigUint64",
            set: "setBigUint64"
        }
    }
}

const SYS_LITTLE_ENDIAN = Utils.getSysEndianness();

class Mutar {
    /*
        Mutar is both toolkit to interact with typed arrays and 
        "modify" them and a constructor of a special object. Or  let's
        say a kit to emulate modification. In Fact each time a  new array
        is created. 
        This comes to a price of course. Each time the array "changes",
        a new array is allocated in memory. Keep that in mind when using
        it.
        Mutar objects and tools on the other hand are a very convenient way 
        to handle binary data. If constructed, the array behaves pretty 
        much as a regular array. You can concatenate, pop, shift, unshift...
        On top of that the type can be changed from - let's say - Uint8 to 
        Float64. Also zero padding can get trimmed. 
    */

    constructor(input, type, littleEndian=SYS_LITTLE_ENDIAN) {
        /*
            Creates a special object. The actual array is locate
            at obj.array, all methods are available at top level.
            Those are all available methods for typed arrays and
            regular arrays. Plus some bonus features.
            
            @input: Can be a TypedArray, a string or buffer and regular array
            @type: A string that needs to be specified for buffer and regular arrayS
        */

        this.littleEndian = littleEndian;

        // Strings are automatically converted to a Uint8Array.
        if (typeof(input) === "string") {
            input = new TextEncoder().encode(input);
        }
        
        // If the input is a TypedArray all information can
        // get read from that object.
        if (ArrayBuffer.isView(input)) {
            this.essentials = input;
            this.type = input.constructor.name;
            this.typeConstructor = Utils.ArrayTypes[input.constructor.name];
        
        // If not the type must be specified and a new typed
        // array gets constructed based on the given information.
        } else {
            let error = true;
            if (type) {
                type = Mutar.typeFromInput(type);
                this.type = type;
                this.typeConstructor = Utils.ArrayTypes[type];
                if (input instanceof ArrayBuffer || Array.isArray(input)) {
                    this.essentials = new this.typeConstructor(input);
                    error = false;
                }
            }
            if (error) throw new TypeError("For Array and ArrayBuffer the type needs to be specified as a second argument.");
        }

        // make build in methods accessible at top level
        this.at = (...args) => this.array.at(...args);
        this.copyWithin = (...args) => this.array.copyWithin(...args);
        this.entries = (...args) => this.array.entries(...args);
        this.every = (...args) => this.array.every(...args);
        this.fill = (...args) => this.array.fill(...args);
        this.filter = (...args) => this.array.filter(...args);
        this.find = (...args) => this.array.find(...args);
        this.findIndex = (...args) => this.array.findIndex(...args);
        this.forEach = (...args) => this.array.forEach(...args);
        this.includes = (...args) => this.array.includes(...args);
        this.indexOf = (...args) => this.array.indexOf(...args);
        this.join = (...args) => this.array.join(...args);
        this.keys = (...args) => this.array.keys(...args);
        this.lastIndexOf = (...args) => this.array.lastIndexOf(...args);
        this.map = (...args) => this.array.map(...args);
        this.reduce = (...args) => this.array.reduce(...args);
        this.reduceRight = (...args) => this.array.reduceRight(...args);
        this.reverse = (...args) => this.array.reverse(...args);
        this.set = (...args) => this.array.set(...args);
        this.slice = (...args) => this.array.slice(...args);
        this.some = (...args) => this.array.some(...args);
        this.sort = (...args) => this.array.sort(...args);
        this.subarray = (...args) => this.array.subarray(...args);
        this.values = (...args) => this.array.values(...args);
    }

    
    // Static methods. To use Mutar as a toolkit for 
    // interacting with typed arrays.

    static typeFromInput(type) {
        // Extract the type from a TypedArray constructor

        if (typeof(type) === "function") {
            type = type.name;
        }
        if (!(type in Utils.ArrayTypes)) {
            if (type in Utils.ArrayShortCuts) {
                type = Utils.ArrayShortCuts[type];
            } else {
                throw new TypeError(`Unknown type: ${type}`);
            }
        }
        return type;
    }

    static getType(obj) {
        // Returns the name of the constructor (Uint8Array, Int16Array, ...)
        return obj.constructor.name;
    }
    
    static isTypedArray(obj) {
        // Test if object is a typed array
        return obj.constructor.name in Utils.ArrayTypes;
    }

    static isTypeOf(obj, type) {
        // Test if array is of type xy

        type = Mutar.typeFromInput(type);
        return obj.constructor.name === type;
    }

    static clone(obj) {
        // returns a copy of the given array
        return obj.slice();
    }

    static concat(obj, ...args) {
        function argsIncludes(arg) {
            if (args.includes(arg)) {
                args.splice(args.indexOf(arg), 1);
                return true;
            }
            return false;
        }

        function throwTypeError(errorObj) {
            throw new TypeError(`Your provided input is not a TypedArray: '${errorObj}' (${errorObj.constructor.name})`);
        }

        const force = argsIncludes("force");
        const trim = argsIncludes("trim");

        if (!Mutar.isTypedArray(obj)) {
            throwTypeError(obj);
        } else if (!args.length) {
            return obj;
        }

        const type = obj.constructor.name;
        let precursor = [...obj];

        args.forEach((nextObj) => {
            if (!Mutar.isTypedArray(nextObj)) {
                throwTypeError(nextObj);
            }

            let next = nextObj; 
            if (nextObj.constructor.name !== type) {
                if (force) {
                    next = Mutar.convert(nextObj, type, trim);
                } else {
                    throw new TypeError(`
                        You are trying to concatenate different types of arrays:
                        > '${type}' and '${nextObj.constructor.name}' <
                        You can force this, by passing the string "force" to the function call.
                    `.replace(/ +/ug, " "));
                }
            }
            precursor = precursor.concat([...next]);
        });
        
        const newArray = Utils.ArrayTypes[type].from(precursor);

        return newArray;
    }

    static convert(obj, type, trim=false, littleEndian=SYS_LITTLE_ENDIAN, view=null) {
        // Converts a given TypedArray to another type.
        // If the new type has less bytes grouped, it is
        // Possible to trim leftover zero padding. If a
        // view is already at hand it can get passed too.

        type = Mutar.typeFromInput(type);
        const byteLen = obj.byteLength;
        const byteDiff = byteLen % Utils.ArrayTypes[type].BYTES_PER_ELEMENT;
        
        let newArray;

        if (!byteDiff) {
            // zero padding is not needed, zeros can get trimmed in some cases
            newArray = new Utils.ArrayTypes[type](obj.buffer);
            if (trim) {
                newArray = Mutar.trim(newArray, littleEndian);
            }
        } else {
            // zero padding is necessary
            const missingBytes = Utils.ArrayTypes[type].BYTES_PER_ELEMENT - byteDiff;
            const newLen = byteLen + missingBytes;
            if (!view) view = new DataView(obj.buffer);
            
            // initialize a new Uint8Array of the required byte length
            let Uint8 = new Uint8Array(newLen);
            
            // Fill the array with the values of the old array
            // (little endian starts on the left hand side. 
            // Insertion can start an 0. Big endian has a
            // calculated starting point).

            const start = (littleEndian) ? 0 : missingBytes;
            for (let i=0, l=obj.byteLength; i<l; i++) {
                Uint8[i+start] = view.getUint8(i, littleEndian);
            }
            newArray = new Utils.ArrayTypes[type](Uint8.buffer);
        }

        return newArray;
    }

    static detach(obj, index) {
        // Returns a new TypedArray from the given obj,
        // the element of the given index is not included
        // and also returned.

        const lastIndex = obj.length-1;
        if (index > lastIndex) {
            throw new RangeError(`The provided index is out of range (gt ${lastIndex})`);
        }
        if (index < 0) {
            index += lastIndex + 1;
            if (index < 0) {
                throw new RangeError(`The provided index is out of range (lt ${-1-lastIndex})`);
            }
        }
        const detached = obj[index];
        let newArray, popped;
        [newArray, popped] = Mutar.pop(obj);
        newArray.copyWithin(index, index+1);
        if (index < lastIndex) {
            newArray[lastIndex-1] = popped;
        }
        return [newArray, detached];
    }

    static insert(obj, index, byte, littleEndian=SYS_LITTLE_ENDIAN) {
        if (index < 0) {
            index = Math.max(obj.length+index+1, 0);
        }
        // TODO: retuen inserted val
        return Mutar.splice(obj, index, 0, byte, littleEndian)[0];
    }

    static push(obj, b, littleEndian=SYS_LITTLE_ENDIAN) {
        // Pushes one byte to the end of a given array.
        
        const type = obj.constructor.name;
        const newArray = new Utils.ArrayTypes[type](obj.length + 1);
        const view = new DataView(newArray.buffer);
        const method = Utils.ViewMethods[type].set;

        newArray.set(obj);
        view[method]((obj.length * obj.BYTES_PER_ELEMENT), b, littleEndian);
        
        return newArray;
    }

    static pop(obj) {
        // Removes one byte from a given array.
        // Returns the new array and the removed
        // byte.

        return [obj.slice(0, -1), obj.at(-1)];
    }

    static unshift(obj, b, littleEndian=SYS_LITTLE_ENDIAN) {
        // Unshifts one byte ro a given array.

        const type = obj.constructor.name;
        const newArray = new Utils.ArrayTypes[type](obj.length + 1);
        const view = new DataView(newArray.buffer);
        const method = Utils.ViewMethods[type].set;

        newArray.set(obj, 1);
        view[method](0, b, littleEndian);
        
        return newArray;    
    }

    static shift(obj) {
        // Shifts one byte from a given array
        // Returns the new array and the removed
        // byte.

        return [obj.slice(1), obj.at(0)];
    }

    static splice(obj, start, deleteCount, ...items) {
        
        const type = obj.constructor.name;
        const len = obj.length;

        if (!Number.isInteger(start)) {
            start = len;
        } else if (start < 0) {
            start = Math.max(len+start, 0);
        }
        start = Math.min(start, len);
        
        if (start === len) {
            deleteCount = 0;
        } else if (!Number.isInteger(deleteCount) || deleteCount >= len-start) {
            deleteCount = len-start;
        } else {
            deleteCount = Math.max(deleteCount, 0);
        }

        let littleEndian = SYS_LITTLE_ENDIAN;
        for (const bool of [false, true]) {
            if (items.indexOf(bool) > -1) { 
                items.splice(items.indexOf(bool), 1);
                littleEndian = bool;
            }
        }

        const end = start + deleteCount; 
        
        const startArray = obj.subarray(0, start);
        const spliced = obj.slice(start, end);
        const endArray = obj.subarray(end, len);

        let newArray;
        const method = Utils.ViewMethods[type].set;

        if (items.length) {
            const ins = new Utils.ArrayTypes[type](items.length);
            const view = new DataView(ins.buffer);
            let i = 0;
            const step = ins.BYTES_PER_ELEMENT;
            for (let j=0, l=ins.byteLength; j<l; j+=step) {
                view[method](j, items[i], littleEndian);
                i++;
            }
            newArray = Mutar.concat(startArray, ins, endArray);
        } else {
            newArray = Mutar.concat(startArray, endArray);
        }

        return [newArray, spliced];
    }

    static trim(obj, littleEndian=SYS_LITTLE_ENDIAN) {
        // Trims null bytes from the given array and returns 
        // a new array. Only padded zeros are getting removed
        // according to the endianness.
        //
        // Example:
        // Integer '400',  binary '110010000'
        //
        // As a Uint32Array:   'Uint32Array(1) [ 400 ]'
        //       -> [00000000000000000000000110010000]
        //
        // As a Uint8Array (big endian):
        // Uint8Array(4) 
        //    [       0,        0,        1,      144]
        //    [00000000, 00000000, 00000001, 10010000]
        //
        // As you can see: the first two bytes are holding
        // no information and can get trimmed without losing
        // information.
        //
        // In little endian it is the same, but the order is
        // flipped. 
        // 
        //    [10010000, 00000001, 00000000, 00000000]
        // -> the last two bytes can get trimmed
        
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
        if (!littleEndian) {
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
            obj = new Utils.ArrayTypes[type](singleBytesView.buffer);
        }
        return obj;
    }

    static zeroPurge(obj) {
        return obj.filter((b) => b !== 0);
    }


    // Methods that are appended to the obj, called 
    // by the constructor. The obj methods are using 
    // the static methods

    set essentials(val) {
        this.array = val;
        this.buffer = val.buffer;
        this.byteLength = val.byteLength;
        this.byteOffset = val.byteOffset;
        this.length = val.length;
        this.view = new DataView(val.buffer);
        this.BYTES_PER_ELEMENT = val.BYTES_PER_ELEMENT;
    }

    get SYS_LITTLE_ENDIAN() {
        return SYS_LITTLE_ENDIAN;
    }

    extractArrayClone() {
        return this.array.slice();
    }
    
    concat(arr) {
        const array = this.constructor.concat(this.array, arr);
        return new Mutar(array);
    }

    conset(arr) {
        // concat and set the array to the concatenated array.
        this.essentials = this.concat(arr).array;
    } 

    convert(type, trim=false, littleEndian=null) {
        type = this.constructor.typeFromInput(type);
        if (littleEndian === null) {
            littleEndian = this.littleEndian;
        }
        this.essentials = this.constructor.convert(this, type, trim, littleEndian, this.view);
        this.type = type;
        this.typeConstructor = Utils.ArrayTypes[type];
    }

    clone() {
        // returns a clone of the current obj
        return new Mutar(this.array.slice());
    }

    detach(index) {
        let detached;
        [this.essentials, detached] = this.constructor.detach(this.array, index)[1];
        return detached;
    }

    insert(index, byte, littleEndian=null) {
        if (littleEndian === null) {
            littleEndian = this.littleEndian;
        }
        this.essentials = this.constructor.insert(this.array, index, byte, this.littleEndian);
    }

    push(b, littleEndian=null) {
        if (littleEndian === null) {
            littleEndian = this.littleEndian;
        }
        this.essentials = this.constructor.push(this.array, b, littleEndian);
        return this.array.at(-1);
    }

    pop() {
        let popped;
        [this.essentials, popped] = this.constructor.pop(this.array);
        return popped;
    }

    unshift(b, littleEndian=null) {
        if (littleEndian === null) {
            littleEndian = this.littleEndian;
        }
        this.essentials = this.constructor.unshift(this.array, b, littleEndian);
        return this.array[0];
    }

    shift() {
        let shifted;
        [this.essentials, shifted] = this.constructor.shift(this.array);
        return shifted;
    }

    splice(...args) {
        let addEndianness = true;
        for (const bool of [false, true]) {
            if (args.indexOf(bool) > -1) { 
                addEndianness = false;
            }
        }
        if (addEndianness) args.push(this.littleEndian);
        let spliced;
        [this.essentials, spliced] = this.constructor.splice(this.array, ...args)
        return spliced;
    }

    trim(littleEndian=null) {
        if (littleEndian === null) {
            // eslint-disable-next-line prefer-destructuring
            littleEndian = this.littleEndian;
        }
        this.essentials = this.constructor.trim(this.array, littleEndian);
    }

    zeroPurge() {
        this.essentials = this.constructor.zeroPurge(this.array);
    }
}

export default Mutar
