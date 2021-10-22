/**
 * [Mutar]{@link https://github.com/UmamiAppearance/MutableTypedArrayJS}
 *
 * @version 0.1.0
 * @author UmamiAppearance [mail@umamiappearance.eu]
 * @license GPL-3.0
 *
 * Mutar is both toolkit a to interact with typed arrays and 
 * "modify" them and a constructor of a special object. Or  let"s
 * say a kit to emulate modification. Each "mutation" actually 
 * creates a new array every time.
 * This comes to a price of course. Each time the array "changes",
 * a new array is allocated in memory. Keep that in mind when using
 * it.
 * Mutar objects and tools on the other hand are a very convenient way 
 * to handle binary data. If constructed, the array behaves pretty 
 * much as a regular array. You can concatenate, pop, shift, unshift...
 * On top of that the type can be changed from - let"s say - Uint8 to 
 * Float64. Also zero padding can get trimmed. 
 */


/* eslint-disable prefer-destructuring */

const Utils = {

    /** 
     * Test endianness:
     * Uint16Array: Uint16Array(1) [ 1 ]
     * Binary:       [00000000 00000001]
     * Uint8 (BE)                  [0 1]
     * Uint8 (LE)                  [1 0]
     * 
     * Looking at index 0 shows 0 for
     * big endian and 1 for little endian
     */
    getSysEndianness: () => {
        const testInt = new Uint16Array([1]);
        const byteRepresentation = new Uint8Array(testInt.buffer);
        return Boolean(byteRepresentation.at(0));
    },

    /**
     * Object which contains all possible TypedArrays
     * and the according constructors.
     */
    ArrayTypes: {
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
    },

    IntegrityError: class IntegrityError extends Error {
        constructor(message) {
            super(message);
            this.name = "IntegrityError";
        }
    },
}

const SYS_LITTLE_ENDIAN = Utils.getSysEndianness();

class Mutar {

    /**
     * Creates a special object. The actual array is located
     * at obj.array, all methods are available at top level.
     * Those are all available methods for typed arrays and
     * most of the ones for regular arrays. Plus some bonus
     * features.
     * 
     * @param {({ buffer: ArrayBufferLike; byteLength: any; byteOffset: any; length: any; BYTES_PER_ELEMENT: any; } | number[] | string)} input - Mut be set. Can be a TypedArray, a string or buffer and regular array
     * @param {string|function} [type] - A string or TypedArray function that must be specified for buffer and regular arrays
     * @param {boolean} [littleEndian=SYS_LITTLE_ENDIAN] - A boolean that sets little endian to true/false
     */
    constructor(input, type, littleEndian=SYS_LITTLE_ENDIAN) {

        this.littleEndian = littleEndian;

        // Strings are automatically converted to a Uint8Array.
        if (typeof(input) === "string") {
            input = new TextEncoder().encode(input);
        }
        
        // If the input is a TypedArray, all information can
        // get read from that object.
        if (ArrayBuffer.isView(input)) {
            this.updateArray = input;
            this.type = input.constructor.name;
            this.typeConstructor = Utils.ArrayTypes[input.constructor.name];

        // If not the type must be specified and a new typed
        // array gets constructed based on the given information.
        } else if (input instanceof ArrayBuffer || Array.isArray(input)) {
            let error = true;
            if (type) {
                type = Mutar.typeFromInput(type);
                this.type = type;
                this.typeConstructor = Utils.ArrayTypes[type];
                if (input instanceof ArrayBuffer || Array.isArray(input)) {
                    this.updateArray = new this.typeConstructor(input);
                    error = false;
                }
            }
            if (error) throw new TypeError("For Array and ArrayBuffer the type needs to be specified as a second argument.");

        } else {
            const emptyMsg = (input) ? "" : "An empty call is not possible.\n";
            throw new TypeError(`${emptyMsg}Allowed input types are: TypedArray, ArrayBuffer, Array, String`);
        }
    }

    
    // -------------- > static methods | toolkit < -------------- //


    /** 
     * Extract the type from a TypedArray constructor
     * 
     * @param {(string|function)} type - Must be a TypedArray constructor, the name of the constructor as string or a shortcut, as defined at "Utils"
     * @returns {string} - The name of the TypedArray constructor as string e.g. "Int8Array"
     */ 
    static typeFromInput(type) {
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


    /**
     * Get Type from "obj.constructor.name"
     * 
     * @param {{ buffer: ArrayBufferLike; byteLength: any; byteOffset: any; length: any; BYTES_PER_ELEMENT: any; }} obj - Must be a TypedArray
     * @returns {string} - Returns the name of the constructor (Uint8Array, Int16Array, ...) 
     */
    static getType(obj) {
        return obj.constructor.name;
    }

    
    /**
     * Test if object is a typed array.
     * 
     * @param {{ buffer: ArrayBufferLike; byteLength: any; byteOffset: any; length: any; BYTES_PER_ELEMENT: any; }} obj - Must be a TypedArray
     * @returns {boolean} - Only true if input object is a TypedArray
     */
    static isTypedArray(obj) {

        return obj.constructor.name in Utils.ArrayTypes;
    }


    /**
     * Test if array is of type "type"
     * 
     * @param {{ buffer: ArrayBufferLike; byteLength: any; byteOffset: any; length: any; BYTES_PER_ELEMENT: any; }} obj - Should be a TypedArray, but any object can get tested for the following name as string
     * @param {string} type - The constructor name the former arg gets tested against. 
     * @returns {boolean} - True if "obj.constructor.name" equals "type" 
     */
    static isTypeOf(obj, type) {

        type = Mutar.typeFromInput(type);
        return obj.constructor.name === type;
    }


    /**
     * Make a copy of the given array
     * 
     * @param {{ buffer: ArrayBufferLike; byteLength: any; byteOffset: any; length: any; BYTES_PER_ELEMENT: any; }} obj - Should be a TypedArray, if you really want to u can clone regular arrays either
     * @returns {{ buffer: ArrayBufferLike; }} - A unrelated copy of the input object
     */
    static clone(obj) {

        return obj.slice();
    }


    /**
     * Concatenates all given array into one. 
     * By default they must be of the same type
     * but conversion to the type of the first
     * element can be forced, by literally passing
     * the string "force".
     * 
     * @param {{ buffer: ArrayBufferLike; byteLength: any; byteOffset: any; length: any; BYTES_PER_ELEMENT: any; }} obj - Must be a TypedArray
     * @param  {(buffer[]|string[])} args - At least one Typed array for concatenation must be handed over. Additionally it takes the strings "force" and "trim".
     * @returns {{ buffer: ArrayBufferLike; }} - A concatenated new TypedArray of the input arrays
     */
    static concat(obj, ...args) {

        // Test if argument is passed and remove it from "args"
        function argsIncludes(arg) {
            if (args.includes(arg)) {
                args.splice(args.indexOf(arg), 1);
                return true;
            }
            return false;
        }

        // Error function
        function throwTypeError(errorObj) {
            throw new TypeError(`Your provided input is not a TypedArray: "${errorObj}" (${errorObj.constructor.name})`);
        }

        const force = argsIncludes("force");
        let trim = argsIncludes("trim");
        if (argsIncludes("purge")) {
            trim = "purge";
        }

        if (!Mutar.isTypedArray(obj)) {
            throwTypeError(obj);
        } else if (!args.length) {
            return obj;
        }

        const type = obj.constructor.name;

        // For starters use an ordinary array for concatenation
        let precursor = [...obj];

        // Walk through all provided arrays and collect
        // them in "precursor"

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
                        > "${type}" and "${nextObj.constructor.name}" <
                        You can force this, by passing the string "force" to the function call.
                    `.replace(/ +/ug, " "));
                }
            }
            precursor = precursor.concat([...next]);
        });
        
        return Utils.ArrayTypes[type].from(precursor);
    }


    /**
     * Converts a given TypedArray to another type.
     * By default, missing zeros are appended to the
     * start or end of the array (depending on the 
     * endianness).
     * Null bytes can get removed (trimmed) directly 
     * in the process. 
     * It is also possible to stretch the array, and
     * zero pad the individual integers, by setting
     * "preserveIntegers" to true.
     * 
     * @param {{ buffer: ArrayBufferLike; byteLength: any; byteOffset: any; length: any; BYTES_PER_ELEMENT: any; }} obj - Must be a TypedArray 
     * @param {(string|function)} type - Must be a TypedArray constructor, the name of the constructor as string or a shortcut, as defined at "Utils"
     * @param {(boolean|string)} [trim=false] - If true padded zeros according to the endianness get trimmed, if set to string "purge" all null bytes get discarded
     * @param {(boolean|string)} [intMode=false] - If true the individual integers keep the same (if they fit). If data loss is intended pass the string "force" 
     * @param {boolean} [littleEndian=SYS_LITTLE_ENDIAN] - A boolean that sets little endian to true/false 
     * @param {Object} [view] - If a view of the array is already defined, pass it here 
     * @returns {{ buffer: ArrayBufferLike; }} - The converted TypedArray
     */
    static convert(obj, type, trim=false, intMode=false, littleEndian=SYS_LITTLE_ENDIAN, view=null) {

        function num(n, bigInt) {
            return (bigInt) ? BigInt(n) : Number(n);
        }

        type = Mutar.typeFromInput(type);
        let newArray;

        // The following mode is looking at the individual
        // integers. Take a look at th following example
        // (big endian byte order, cause easier to read)
        //
        //      Uint16Array(2) [               200               400 ]
        //      Uint8Array(4)  [               200        1      144 ]
        //      Binary         [ 00000000 11001000 00000001 10010000 ]
        //
        // Converted to Uint32:
        //      Binary         [ 00000000 00000000 00000000 11001000 00000000 00000000 10010000 00000001 ]
        //      Uint8Array(8)  [        0        0        0      200        0        0      144        1 ]
        //      Uint32Array(2) [                                 200                                 400 ]        
        // 
        // The ArrayBuffer has now doubled in size, but the view (Uint32) has the same two values as the
        // initial Uint16Array.
        // There is no issue going up, the other direction can be problematic

        if (intMode) {
            
            const curBytesPerElem = obj.BYTES_PER_ELEMENT;
            const newBytesPerElem = Utils.ArrayTypes[type].BYTES_PER_ELEMENT;

            // Set the byte difference. A negative value
            // means, that the new array is bigger and no
            // data loss is to be feared, therefore set to
            // zero (false).
            const byteDiff = Math.max(curBytesPerElem-newBytesPerElem, 0);
            const testIntegrity = (intMode !== "force" && byteDiff);
            
            if (!view) view = new DataView(obj.buffer);

            newArray = new Utils.ArrayTypes[type](obj.length);
            const nView = new DataView(newArray.buffer);

            const getCur = Utils.ViewMethods[obj.constructor.name].get;
            const getNew = Utils.ViewMethods[type].get;
            const set = Utils.ViewMethods[type].set;

            const bigInt = (newBytesPerElem > 7);
            
            for (let i=0; i<obj.length; i++) {
                const curOffset = i * curBytesPerElem;
                const val = num(view[getCur](curOffset, littleEndian), bigInt);

                if (testIntegrity) {
                    // Valid:
                    // Uint16Array(2) [ 00000000 11001000 ] = 200
                    // Uint8Array(1)  [          11001000 ] = 200
                    //
                    // Invalid:
                    // Uint16Array(2) [00000001 10010000 ] = 400
                    // Uint8Array(1)  [         10010000 ] = 144
                    const expectedVal = num(view[getNew](curOffset, littleEndian), bigInt);
                    if (val !== expectedVal) throw new Utils.IntegrityError("Converting the array will cause data loss. If you explicity want this, pass the string 'force' for intMode");
                }

                const newOffset = i * newBytesPerElem;
                nView[set](newOffset, val, littleEndian);
            }

        
        // The following regular mode is not changing the buffer
        // if not necessary. If conversion is not possible, zeros
        // are added to the end or the beginning of the buffer
        // (depending on the endianness).
        // 
        // Example (Again BE):
        // Uint8Array(3)  [   1 234 56 ]
        // Uint32Array(1) [ 0 1 234 56 ] = 125496
        //
        } else {
            const byteLen = obj.byteLength;
            const byteDiff = byteLen % Utils.ArrayTypes[type].BYTES_PER_ELEMENT;
            

            // zero padding is not needed
            if (!byteDiff) {
                newArray = new Utils.ArrayTypes[type](obj.buffer);
                if (trim) {
                    newArray = Mutar.trim(newArray, (trim === "purge"), littleEndian);
                }
            
            // zero padding is necessary
            } else {    
                const missingBytes = Utils.ArrayTypes[type].BYTES_PER_ELEMENT - byteDiff;
                const newLen = byteLen + missingBytes;
                
                // initialize a new Uint8Array of the required byte length
                let Uint8 = new Uint8Array(newLen);

                // create the requested view
                newArray = new Utils.ArrayTypes[type](Uint8.buffer);
                
                // create a Uint8View if necessary
                const Uint8ViewOrig = (obj.BYTES_PER_ELEMENT > 1) ? new Uint8Array(obj.buffer) : obj;
                
                // Define offset, based on the endianness
                const offset = (littleEndian) ? 0 : missingBytes;
                Uint8.set(Uint8ViewOrig, offset);
            }
        }

        return newArray;
    }


    /**
     * Takes an object, reverses the individual integers
     * and returns it.
     * 
     * @param {{ buffer: ArrayBufferLike; byteLength: any; byteOffset: any; length: any; BYTES_PER_ELEMENT: any; }} obj - Must be a TypedArray 
     * @returns {{ buffer: ArrayBufferLike; }} - A new TypedArray with reversed integers
     */
    static flipEndianness(obj) {

        const bytesPerElem = obj.constructor.BYTES_PER_ELEMENT 
        if (bytesPerElem > 1) {
            const singleBytesView = new Uint8Array(obj.buffer);
            for (let i=0, l=obj.byteLength; i<l; i+=bytesPerElem) {
                singleBytesView.subarray(i, i+bytesPerElem).reverse();
            }
        } else {
            // reverse the array
            obj.reverse();
        }

        return obj;
    }


    /**
     * Returns a new TypedArray from the given obj,
     * the element of the given index is excluded
     * and also returned.
     * 
     * @param {{ buffer: ArrayBufferLike; byteLength: any; byteOffset: any; length: any; BYTES_PER_ELEMENT: any; }} obj - Must be a TypedArray 
     * @param {number} index - Positive or negative index key. Over- or underflow cannot happen.
     * @param {boolean} [littleEndian=SYS_LITTLE_ENDIAN] - A boolean that sets little endian to true/false
     * @returns {Array} - Returns the new TypedArray and the detached value
     */
    static detach(obj, index, littleEndian=SYS_LITTLE_ENDIAN) {

        index = Math.min(index, obj.length-1);
        let detached, newArray;
        [newArray, detached] = Mutar.splice(obj, index, 1, littleEndian);
        
        const get = Utils.ViewMethods[obj.constructor.name].get;
        const detachedView = new DataView(detached.buffer);
        detached = detachedView[get](0, littleEndian);

        return [newArray, detached];
    }


    /**
     * Inserts a value at the given index.
     * 
     * @param {{ buffer: ArrayBufferLike; byteLength: any; byteOffset: any; length: any; BYTES_PER_ELEMENT: any; }} obj - Must be a TypedArray
     * @param {number} index - Positive or negative index key. Over- or underflow cannot happen. 
     * @param {number} integer - Positive or negative integer.
     * @param {boolean} [littleEndian=SYS_LITTLE_ENDIAN] - A boolean that sets little endian to true/false 
     * @returns {Array} - Returns the new TypedArray and the new array length
     */
    static insert(obj, index, integer, littleEndian=SYS_LITTLE_ENDIAN) {

        if (index < 0) {
            // -1 Is the end of the new array
            index = Math.max(obj.length+index+1, 0);
        } else if (index > obj.length) {
            // The index has to stop at the new last index.
            // (splice handles this anyway, but "index"
            // changes in that case.)
            index = obj.length;
        }
        const newArray = Mutar.splice(obj, index, 0, integer, littleEndian)[0];
        return [newArray, newArray.length];
    }


    /**
     * Pushes values to the end of a given array.
     * 
     * @param {{ buffer: ArrayBufferLike; byteLength: any; byteOffset: any; length: any; BYTES_PER_ELEMENT: any; }} obj - Must be a TypedArray 
     * @param  {(...number|boolean)} args - Positive or negative integers, last element can be the endianness bool
     * @returns {Array} - Returns the new TypedArray and the new array length
     */
    static push(obj, ...args) {
        
        const newArray = Mutar.splice(obj, obj.length, 0, ...args)[0];
        return [newArray, newArray.length];
    }


    /**
     * Pops one integer from a given array.
     * Returns the new array and the removed
     * int.
     * 
     * @param {{ buffer: ArrayBufferLike; byteLength: any; byteOffset: any; length: any; BYTES_PER_ELEMENT: any; }} obj - Must be a TypedArray 
     * @param {boolean} [littleEndian=SYS_LITTLE_ENDIAN] - A boolean that sets little endian to true/false
     * @param {Object} [view] - If a view of the array is already defined, pass it here
     * @returns {Array} - Returns the new TypedArray and the new array length
     * 
     */
    static pop(obj, littleEndian=SYS_LITTLE_ENDIAN, view=null) {
        if (!view) view = new DataView(obj.buffer);
        const get = Utils.ViewMethods[obj.constructor.name].get;
        const lastIntIndex = (obj.length-1) * obj.BYTES_PER_ELEMENT;
        const popped = view[get](lastIntIndex, littleEndian);
        return [obj.slice(0, -1), popped];
    }


    /**
     * Unshifts bytes to the beginning of a given array.
     * 
     * @param {{ buffer: ArrayBufferLike; byteLength: any; byteOffset: any; length: any; BYTES_PER_ELEMENT: any; }} obj - Must be a TypedArray 
     * @param  {(...number|boolean)} args - Positive or negative integers, last element can be the endianness bool
     * @returns {Array} - Returns the new TypedArray and the new array length
     */
    static unshift(obj, ...args) {
        const newArray = Mutar.splice(obj, 0, 0, ...args)[0];
        return [newArray, newArray.length];
    }


    /**
     * Shifts one integer from a given array.
     * Returns the new array and the removed
     * int.
     * 
     * @param {{ buffer: ArrayBufferLike; byteLength: any; byteOffset: any; length: any; BYTES_PER_ELEMENT: any; }} obj - Must be a TypedArray
     * @param {boolean} [littleEndian=SYS_LITTLE_ENDIAN] - A boolean that sets little endian to true/false
     * @param {Object} [view] - If a view of the array is already defined, pass it here
     * @returns {Array} - Returns the new TypedArray and the new array length
     * 
     */
    static shift(obj, littleEndian=SYS_LITTLE_ENDIAN, view=null) {
        if (!view) view = new DataView(obj.buffer);
        const get = Utils.ViewMethods[obj.constructor.name].get;
        const shifted = view[get](0, littleEndian);

        return [obj.slice(1), shifted];
    }


    /**
     * Works basically as "Array.splice()". Endianness
     * is taken into account. Gets called by many other
     * functions (push, unshift...)
     * 
     * @param {{ buffer: ArrayBufferLike; byteLength: any; byteOffset: any; length: any; BYTES_PER_ELEMENT: any; }} obj 
     * @param {number} start - Positive or negative index key. Over- or underflow cannot happen.  
     * @param {number} deleteCount - Positive number (count) 
     * @param  {(...numbers|boolean)} items - Integers for insertion. The last item can be a boolean, which indicates if little endian is true/false 
     * @returns {Array} - Returns the new array and the array of items, that were spliced
     * 
     */
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

        const littleEndian = (typeof(items.at(-1)) === "boolean") ? items.splice(-1, 1)[0] : SYS_LITTLE_ENDIAN;

        const end = start + deleteCount; 
        
        const startArray = obj.subarray(0, start);
        const spliced = obj.slice(start, end);
        const endArray = obj.subarray(end, len);

        let newArray;
        const set = Utils.ViewMethods[type].set;

        if (items.length) {
            const ins = new Utils.ArrayTypes[type](items.length);
            const view = new DataView(ins.buffer);
            let i = 0;
            const step = ins.BYTES_PER_ELEMENT;
            for (let j=0, l=ins.byteLength; j<l; j+=step) {
                view[set](j, items[i], littleEndian);
                i++;
            }
            newArray = Mutar.concat(startArray, ins, endArray);
        } else {
            newArray = Mutar.concat(startArray, endArray);
        }

        return [newArray, spliced];
    }


    /**
     * Can safely remove zero padding, if purge
     * is true, all null bytes get removed. This
     * will destroy data integrity in many cases.
     *  
     * @param {{ buffer: ArrayBufferLike; byteLength: any; byteOffset: any; length: any; BYTES_PER_ELEMENT: any; }} obj - Must be a TypedArray 
     * @param {boolean} [purge=false] - Set to true for removing all zero bytes
     * @param {boolean} [littleEndian=SYS_LITTLE_ENDIAN] - Endianness decides where zero padding can get removed (start or end of array) 
     * @returns {{ buffer: ArrayBufferLike; }} - A trimmed TypedArray, probably smaller than the input
     * 
     */
    static trim(obj, purge=false, littleEndian=SYS_LITTLE_ENDIAN) {

        if (purge) {
            return obj.filter((b) => b !== 0);
        }

        const len = obj.length;
        let start = 0;
        let end = len-1;

        // Look at the right hand side of the array
        // for big endian and left hand for little. 

        if (!littleEndian) {
            for (start; start<len; start++) {
                if (obj[start]) {
                    break;
                }
            }
        } else {
            for (end; end>=0; end--) {
                if (obj[end]) {
                    break;
                }
            }
        }

        return obj.slice(start, end+1);
    }


    // ----------------- > instance methods < ----------------- //

    /**
     * Setter for refreshing the object after the
     * length of the array has changed.
     * 
     * @param {{ buffer: ArrayBufferLike; byteLength: any; byteOffset: any; length: any; BYTES_PER_ELEMENT: any; }} typedArray
     */
    set updateArray(typedArray) {
        this.array = typedArray;
        this.buffer = typedArray.buffer;
        this.byteLength = typedArray.byteLength;
        this.byteOffset = typedArray.byteOffset;
        this.length = typedArray.length;
        this.view = new DataView(typedArray.buffer);
        this.BYTES_PER_ELEMENT = typedArray.BYTES_PER_ELEMENT;
    }


    /**
     * Getter to check the systems endianness
     */
    get SYS_LITTLE_ENDIAN() {
        return SYS_LITTLE_ENDIAN;
    }


    /**
     * Returns a clone of the current array.
     * The ArrayBuffer is not shared.
     * 
     * @returns {{ buffer: ArrayBufferLike; }} - A clone of the current array.
     */
    extractArrayClone() {
        return this.array.slice();
    }
    

    /**
     * Calls Mutar.concat.
     * @param  {(...buffer|string[])} args - At least one Typed array for concatenation. Additionally takes the strings "force" and "trim"
     * @returns {Object} - A new Mutar object with the concatenated array
     */
    concat(...args) {
        const array = this.constructor.concat(this.array, ...args);
        return new Mutar(array);
    }


    /**
     * Concat and set the array to the concatenated array.
     * (Same as concat, but replaces the existing array)
     * 
     * @param  {(...buffer|string[])} args - At least one Typed array for concatenation. Additionally takes the strings "force" and "trim"
     */
    conset(arr) {
        
        this.updateArray = this.concat(arr).array;
    } 


    /**
     * Calls Mutar.convert
     * @param {(string|function)} type - Must be a TypedArray constructor, the name of the constructor as string or a shortcut, as defined at "Utils"
     * @param {(boolean|string)} [trim=false] - If true, padded zeros according to the endianness get trimmed, if set to string "purge" all null bytes get discarded 
     * @param {boolean} [intMode=false] - If true the individual integers keep the same (if they fit)
     */
    convert(type, trim=false, intMode=false) {
        type = this.constructor.typeFromInput(type);
        this.updateArray = this.constructor.convert(this.array, type, trim, intMode, this.littleEndian, this.view);
        this.type = type;
        this.typeConstructor = Utils.ArrayTypes[type];
    }


    /**
     * Returns a clone of the Mutar object. The ArrayBuffer
     * of the array is not shared with the original.
     * 
     * @returns {Object} - A independent copy of the current Mutar object 
     */
    clone() {  
        return new Mutar(this.array.slice());
    }


    /**
     * Calls Mutar.flipEndianness
     * @param {boolean} [changeProperty=true] - If not set to false, the value obj.littleEndian changes (true->false/false->true) 
     */
    flipEndianness(changeProperty=true) {
        this.updateArray = this.constructor.flipEndianness(this.array);
        if (changeProperty) {
            this.littleEndian = !this.littleEndian;
        }
    }


    /**
     * Calls Mutar.detach
     * @param {number} index - Positive or negative index key. Over- or underflow cannot happen.
     * @param {boolean} [littleEndian=this.littleEndian] - A boolean that sets little endian to true/false 
     * @returns {number} - The detached integer
     */
    detach(index, littleEndian=null) {
        if (littleEndian === null) {
            littleEndian = this.littleEndian;
        }
        let detached;
        [this.updateArray, detached] = this.constructor.detach(this.array, index, this.littleEndian);
        return detached;
    }


    /**
     * Calls Mutar.insert
     * @param {number} index - Positive or negative index key. Over- or underflow cannot happen. 
     * @param {number} integer - Positive or negative integer.
     * @param {boolean} [littleEndian=this.littleEndian] - A boolean that sets little endian to true/false 
     * @returns {number} - The new length of the array
     */
    insert(index, integer, littleEndian=null) {
        if (littleEndian === null) {
            littleEndian = this.littleEndian;
        }
        let len;
        [this.updateArray, len] = this.constructor.insert(this.array, index, integer, this.littleEndian);
        return len;
    }


    /**
     * Calls Mutar.push
     * @param  {(...number|boolean)} args - Positive or negative integers, last element can be the endianness bool
     * @returns {number} - The new length of the array
     */
    push(...args) {
        if (typeof(args.at(-1)) !== "boolean") {
            args.push(this.littleEndian);
        }
        let len;
        [this.updateArray, len] = this.constructor.push(this.array, ...args);
        return len;
    }


    /**
     * Calls Mutar.pop
     * @param {boolean} [littleEndian=this.littleEndian] - A boolean that sets little endian to true/false
     * @returns {number} - The popped integer
     */
    pop(littleEndian=null) {
        if (littleEndian === null) {
            littleEndian = this.littleEndian;
        }
        let popped;
        [this.updateArray, popped] = this.constructor.pop(this.array, littleEndian, this.view);
        return popped;
    }


    /**
     * Calls Mutar.unshift
     * @param  {(...number|boolean)} args - Positive or negative integers, last element can be the endianness bool
     * @returns {number} - The new length of the array
     */
    unshift(...args) {
        if (typeof(args.at(-1)) !== "boolean") {
            args.push(this.littleEndian);
        }
        let len;
        [this.updateArray, len] = this.constructor.unshift(this.array, ...args);
        return len;
    }


    /**
     * Calls Mutar.shift
     * @param {boolean} [littleEndian=this.littleEndian] - A boolean that sets little endian to true/false
     * @returns {number} - The shifted integer
     */
    shift(littleEndian=null) {
        if (littleEndian === null) {
            littleEndian = this.littleEndian;
        }
        let shifted;
        [this.updateArray, shifted] = this.constructor.shift(this.array, littleEndian, this.view);
        return shifted;
    }


    /**
     * Calls Mutar.splice
     * @param {number} start - Positive or negative index key. Over- or underflow cannot happen.  
     * @param {number} deleteCount - Positive number (count) 
     * @param  {(...numbers|boolean)} items - Integers for insertion. The last item can be a boolean, which indicates if little endian is true/false  
     * @returns {{ buffer: ArrayBufferLike; }} - A typed array of the spliced integers
     */
    splice(start, deleteCount, ...items) {
        if (typeof(items.at(-1)) !== "boolean") {
            items.push(this.littleEndian);
        }
        let spliced;
        [this.updateArray, spliced] = this.constructor.splice(this.array, start, deleteCount, ...items)
        return spliced;
    }


    /**
     * Calls Mutar.trim
     * @param {boolean} [purge=false] - Set to true for removing all zero bytes
     * @param {boolean} [littleEndian=this.littleEndian] - Endianness decides where zero padding can get removed (start or end of array) 
     */
    trim(purge=false, littleEndian=null) {
        if (littleEndian === null) {
            littleEndian = this.littleEndian;
        }
        this.updateArray = this.constructor.trim(this.array, purge, littleEndian);
    }
}


// make build in array methods accessible at root
[
    "at",
    "copyWithin",
    "entries",
    "every",
    "fill",
    "filter",
    "find",
    "findIndex",
    "forEach",
    "includes",
    "indexOf",
    "join",
    "keys",
    "lastIndexOf",
    "map",
    "reduce",
    "reduceRight",
    "reverse",
    "slice",
    "some",
    "sort",
    "values",
].forEach((fn) => {
    // eslint-disable-next-line no-new-func
    const method = new Function("...args", `return this.array.${fn}(...args)`);
    Object.defineProperty(method, "name", {value: fn});
    Mutar.prototype[fn] = method;
});


export default Mutar
