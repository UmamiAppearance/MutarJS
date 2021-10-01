const ArrayTypes = {
    Int8Array: Int8Array,
    Uint8Array: Uint8Array,
    Uint8ClampedArray: Uint8ClampedArray,
    Int16Array: Int16Array,
    Uint16Array: Uint16Array,
    Int32Array: Int32Array,
    Uint32Array: Uint32Array,
    Float32Array: Float32Array,
    Float64Array: Float64Array
}

class MutableTypedArray {
    constructor(input, type) {
        const MTAObj = new Object();
        if (ArrayBuffer.isView(input)) {
            MTAObj.type = input.constructor.name;
            MTAObj.typeConstructor = ArrayTypes[MTAObj.type];
            MTAObj.array = input;
            MTAObj.buffer = MTAObj.array.buffer;
        } else {
            let error = true;
            if (type) {
                if (typeof(type) === "function") type = type.name;
                MTAObj.type = type;
                if (!(MTAObj.type in ArrayTypes)) throw new TypeError(`Unknown type: ${MTAObj.type}`);
                MTAObj.typeConstructor = ArrayTypes[type];
                if (input instanceof ArrayBuffer || Array.isArray(input)) {
                    MTAObj.array = new MTAObj.typeConstructor(input);
                    MTAObj.buffer = MTAObj.array.buffer;
                    error = false;
                }
            }
            if (error) throw new TypeError("Input must be a TypedArray, an ArrayBuffer or an Array. For Array and ArrayBuffer the type needs to be specified as a second argument.");
        }
        MTAObj.view = new DataView(MTAObj.buffer);

        // append static functions
        


        return MTAObj;
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

    static push(obj, b) {
        const newArray = new ArrayTypes[obj.constructor.name](obj.length + 1);
        newArray.set(obj);
        newArray[obj.length] = b;
        return newArray;
    }

    static shift(obj, b) {
        const newArray = new ArrayTypes[obj.constructor.name](obj.length + 1);
        newArray.set(obj, 1);
        newArray[0] = b;
        return newArray;
    }

    static concat(objA, objB) {
        if (objA.constructor.name !== objB.constructor.name) {
            throw new TypeError(`You are trying to concatenate two different types of arrays ('${objA.constructor.name}' and '${objB.constructor.name}')\nThis can only be done by converting them into the same type before.`);
        }
        const newArray = new ArrayTypes[objA.constructor.name](objA.length + objB.length);
        newArray.set(objA);
        newArray.set(objB, objA.length);
        return newArray;
    }

}
