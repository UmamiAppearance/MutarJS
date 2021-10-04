const ArrayTypes = {
    Int8Array: {
        fn: Int8Array,
        bytes: 1
    },
    Uint8Array: {
        fn: Uint8Array,
        bytes: 1
    },
    Uint8ClampedArray: {
        fn: Uint8ClampedArray,
        bytes: 1
    },
    Int16Array: {
        fn: Int16Array,
        bytes: 2
    },
    Uint16Array: {
        fn: Uint16Array,
        bytes: 2
    },
    Int32Array: {
        fn: Int32Array,
        bytes: 4
    },
    Uint32Array: {
        fn: Uint32Array,
        bytes: 4
    },
    Float32Array: {
        fn: Float32Array,
        bytes: 4
    },
    Float64Array: {
        fn: Float64Array,
        bytes: 8
    },
    BigInt64Array: {
        fn: BigInt64Array,
        bytes: 8
    },
    BigUint64Array: {
        fn: BigUint64Array,
        bytes: 8
    }
}

const bigEndian = (() => {  
    const testInt = new Uint16Array([1]);
    const byteRepresentation = new Uint8Array(testInt.buffer);
    return Boolean(byteRepresentation[1]);
})();

class MutableTypedArray {
    constructor(input, type) {
        
        const MTAObj = {
            set arrayContent(val) {
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

        if (typeof(input) === "string") {
            input = new TextEncoder().encode(input);
        }
        
        if (ArrayBuffer.isView(input)) {
            MTAObj.arrayContent = input;
            MTAObj.type = input.constructor.name;
            MTAObj.typeConstructor = ArrayTypes[MTAObj.type].fn;
        } else {
            let error = true;
            if (type) {
                type = MutableTypedArray.typeFromInput(type);
                MTAObj.type = type;
                MTAObj.typeConstructor = ArrayTypes[type].fn;
                if (input instanceof ArrayBuffer || Array.isArray(input)) {
                    MTAObj.arrayContent = new MTAObj.typeConstructor(input);
                    error = false;
                }
            }
            if (error) throw new TypeError("Input must be String, TypedArray, ArrayBuffer or Array. For Array and ArrayBuffer the type needs to be specified as a second argument.");
        }

        this.appendMethods(MTAObj);
        
        return MTAObj;
    }

    static typeFromInput(type) {
        if (typeof(type) === "function") {
            type = type.name;
        }
        if (!(type in ArrayTypes)) {
            throw new TypeError(`Unknown type: ${type}`);
        }
        return type;
    }

    static getType(obj) {
        return obj.constructor.name;
    }
    
    static isTypedArray(obj) {
        return obj.constructor.name in ArrayTypes;
    }

    static isTypeOf(obj, type) {
        return obj.constructor.name === type;
    }

    static convert(obj, type) {
        type = MutableTypedArray.typeFromInput(type);
        const byteLen = obj.byteLength;
        const missingBytes = byteLen % ArrayTypes[type].bytes;
        
        let newArray;

        if (!missingBytes) {
            newArray = new ArrayTypes[type].fn(obj.buffer);
        } else {
            const newLen = byteLen + ArrayTypes[type].bytes - missingBytes;
            const view = new DataView(obj.buffer);
            const Uint8 = new Uint8Array(newLen);
            const start = (bigEndian) ? missingBytes : 0;
            for (let i=0, l=obj.byteLength; i<l; i++) {
                Uint8[i+start] = view.getUint8(i);
            }
            newArray = new ArrayTypes[type].fn(Uint8.buffer);
        }
        return newArray;
    }

    static pushTo(obj, b) {
        const newArray = new ArrayTypes[obj.constructor.name].fn(obj.length + 1);
        newArray.set(obj);
        newArray[obj.length] = b;
        return newArray;
    }

    static popFrom(obj) {
        return [obj.slice(0, -1), obj.at(-1)];
    }

    static unshiftTo(obj, b) {
        const newArray = new ArrayTypes[obj.constructor.name].fn(obj.length + 1);
        newArray.set(obj, 1);
        newArray[0] = b;
        return newArray;
    }

    static shiftFrom(obj) {
        return [obj.slice(1), obj.at(0)];
    }

    static concat(objA, objB) {
        if (objA.constructor.name !== objB.constructor.name) {
            throw new TypeError(`You are trying to concatenate two different types of arrays ('${objA.constructor.name}' and '${objB.constructor.name}')\nThis can only be done by converting them into the same type before.`);
        }
        const newArray = new ArrayTypes[objA.constructor.name].fn(objA.length + objB.length);
        newArray.set(objA);
        newArray.set(objB, objA.length);
        return newArray;
    }

    appendMethods(obj) {

        obj.concat = (arr) => {
            const array = MutableTypedArray.concat(obj.array, arr);
            return new MutableTypedArray(array);
        };

        obj.conset = (arr) => obj.arrayContent = obj.concat(arr).array;

        obj.push = (b) => {
            obj.arrayContent = MutableTypedArray.pushTo(obj.array, b);
            return obj.array.at(-1);
        };

        obj.pop = () => {
            let popped;
            [obj.arrayContent, popped] = MutableTypedArray.popFrom(obj.array);
            return popped;
        };

        obj.unshift = (b) => {
            obj.arrayContent = MutableTypedArray.unshiftTo(obj.array, b);
            return obj.array[0];
        };

        obj.shift = () => {
            let shifted;
            [obj.arrayContent, shifted] = MutableTypedArray.shiftFrom(obj.array);
            return shifted;
        };

        // make build in methods accessible
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
