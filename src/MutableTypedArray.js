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
        const MTAObj = {
            set arrayContent(val) {
                this.array = val;
                this.buffer = val.buffer;
                this.view = new DataView(val.buffer);
            },
            type: null,
            typeConstructor: null,
        }
        if (ArrayBuffer.isView(input)) {
            MTAObj.arrayContent = input;
            MTAObj.type = input.constructor.name;
            MTAObj.typeConstructor = ArrayTypes[MTAObj.type];
        } else {
            let error = true;
            if (type) {
                if (typeof(type) === "function") {
                    type = type.name;
                }
                if (!(type in ArrayTypes)) {
                    throw new TypeError(`Unknown type: ${MTAObj.type}`);
                }
                MTAObj.type = type;
                MTAObj.typeConstructor = ArrayTypes[type];
                if (input instanceof ArrayBuffer || Array.isArray(input)) {
                    MTAObj.arrayContent = new MTAObj.typeConstructor(input);
                    error = false;
                }
            }
            if (error) throw new TypeError("Input must be a TypedArray, an ArrayBuffer or an Array. For Array and ArrayBuffer the type needs to be specified as a second argument.");
        }

        this.appendMethods(MTAObj);
        
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

    static pushTo(obj, b) {
        const newArray = new ArrayTypes[obj.constructor.name](obj.length + 1);
        newArray.set(obj);
        newArray[obj.length] = b;
        return newArray;
    }

    static shiftTo(obj, b) {
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

    appendMethods(obj) {
        obj.push = (b) => {
            const oldArray = obj.array;
            const lastIndex = oldArray.length;
            const array = new obj.typeConstructor(lastIndex + 1);
            array.set(oldArray);
            array[lastIndex] = b;
            obj.arrayContent = array;

            return obj.array[lastIndex];
        },

        obj.shift = (b) => {
            const oldArray = obj.array;
            const array = new obj.typeConstructor(obj.array.length + 1);
            array.set(oldArray, 1);
            array[0] = b;
            obj.arrayContent = array;
            return obj.array[0];
        },

        obj.pop = () => {
            const trace = obj.array.slice(-1)[0];
            obj.arrayContent = obj.array.slice(0, -1);
            return trace;
        },

        obj.unshift = () => {
            const trace = obj.array[0];
            obj.arrayContent = obj.array.slice(1);
            return trace;
        }
    }
}
