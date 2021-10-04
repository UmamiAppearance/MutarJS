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

const bigEndian = (() => {  
    const testInt = new Uint16Array([1]);
    const byteRepresentation = new Uint8Array(testInt.buffer);
    return Boolean(byteRepresentation[1]);
})();

class MTA {
    constructor(input, type) {
        
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

        if (typeof(input) === "string") {
            input = new TextEncoder().encode(input);
        }
        
        if (ArrayBuffer.isView(input)) {
            MTAObj.arraySetter = input;
            MTAObj.type = input.constructor.name;
            MTAObj.typeConstructor = ArrayTypes[MTAObj.type];
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

    static concat(objA, objB) {
        if (objA.constructor.name !== objB.constructor.name) {
            throw new TypeError(`You are trying to concatenate two different types of arrays ('${objA.constructor.name}' and '${objB.constructor.name}')\nThis can only be done by converting them into the same type before.`);
        }
        const newArray = new ArrayTypes[objA.constructor.name](objA.length + objB.length);
        newArray.set(objA);
        newArray.set(objB, objA.length);
        return newArray;
    }

    static convert(obj, type, trim=false, view=null) {
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
            if (view) view = new DataView(obj.buffer);
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
        const newArray = new ArrayTypes[obj.constructor.name].fn(obj.length + 1);
        newArray.set(obj);
        newArray[obj.length] = b;
        return newArray;
    }

    static popFrom(obj) {
        return [obj.slice(0, -1), obj.at(-1)];
    }

    static unshiftTo(obj, b) {
        const newArray = new ArrayTypes[obj.constructor.name](obj.length + 1);
        newArray.set(obj, 1);
        newArray[0] = b;
        return newArray;
    }

    static shiftFrom(obj) {
        return [obj.slice(1), obj.at(0)];
    }

    static trim(obj) {
        
        function giveBack(bytes, bytesPerElem) {
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
        
        let singleBytesView = (isGrouped) ? new Uint8Array(obj.buffer) : obj;

        const absEnd = obj.byteLength-1;
        let end = absEnd;
        let start = 0;

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
        if (start > 0 || end < absEnd) {
            singleBytesView = singleBytesView.slice(start, end+1);
            obj = new ArrayTypes[type](singleBytesView.buffer);
        }
        return obj;
    }

    appendMethods(obj) {

        obj.concat = (arr) => {
            const array = MTA.concat(obj.array, arr);
            return new MTA(array);
        };

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
