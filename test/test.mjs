/* eslint-disable no-console */
import Mutar from "../src/Mutar.js";

const result = {
    tests: 0,
    errors: 0,
    errorMessages: {},
    units: {}
};

function makeError(unit, subUnit, input, output, expected) {
    result.errors++;
    result.units[unit].errors++;
    result.errorMessages[unit][`#${result.errors}`] = {
        "sub-unit": subUnit,
        input: input,
        output: output,
        expected: expected
    };
    const message = `___\nError occurred while testing '${unit}' ('${subUnit}'):\nInput: ${input}\nOutput: ${output}\nExpected: ${expected}`;
    console.error(message);
}

function makeUnit(unit) {
    result.units[unit] = {
        errors: 0,
        tests: 0,
    };
    result.errorMessages[unit] = {}; 
}

function typeTests() {
    /*
        Tests for the simple functions of type 
        conversions and type analysis.
    */
   
    const unit = "type-test";
    const Uint8 = new Uint8Array(1);
    makeUnit(unit);

    const inputs = [Uint8Array, Uint8, Uint8];
    const expectations = ["Uint8Array", "Uint8Array", true, true];

    ["typeFromInput", "getType", "isTypedArray"].forEach((subUnit, i) => {
        result.tests++;
        result.units[unit].tests++;

        const output = Mutar[subUnit](inputs[i]);
        if (output !== expectations[i]) {
            makeError(
                unit,
                subUnit,
                Uint8,
                output,
                expectations[i]
            );
        }
    });

    result.tests++;
    result.units[unit].tests++;

    const output = Mutar.isTypeOf(Uint8, "Uint8Array");
    if (output === false) {
        makeError(
            unit,
            "isTypeOf",
            Uint8,
            output,
            true
        );
    }
}

function objTests() {
    const unit = "object-tests";
    
    // initialize object
    const obj = new Mutar("Hello ");

    makeUnit(unit);
    
    function next() {
        result.tests++;
        result.units[unit].tests++;
    }

    // ------------------------------------------------ //
    // testA - conset (tests concat either)
    // expect: complete string "Hello World!" after decoding
    
    next();

    const arrayB = new Uint8Array([87, 111, 114, 108, 100, 33]);

    obj.conset(arrayB);

    // Decode the array
    const outputA = new TextDecoder().decode(obj.array);
    const expectedA = "Hello World!";

    if (outputA !== expectedA) {
        makeError(
            unit,
            "conset",
            arrayB,
            outputA,
            expectedA
        );
    }

    // ------------------------------------------------ //
    // testB - convert
    // expect: integer "4247253545" after conversion to Uint32 and addition of the 3 individual bytes
    
    next();

    // convert the array to Uint32 and join to string
    
    const inputB = `MutarUint8Array(${obj.array.join()})`;
    
    obj.convert(Uint32Array);
    
    // to avoid problems with endianness all uint32 integers are added up
    // (which can be risky with bigger arrays -> integer overflow)
    const outputB = obj.array[0] + obj.array[1] + obj.array[2];
    const expectedB = 4247253545;

    if (outputB !== expectedB) {
        makeError(
            unit,
            "convert",
            inputB,
            "Addition of 3 Uint32 -> ".concat(outputB),
            "Addition of 3 Uint32 -> ".concat(expectedB)
        );
    }

    // ------------------------------------------------ //
    // testC - convert way up, get one BigUint
    // expect: BigUint "8022916924116329800n" at byte 0 (little endian)
    
    next();

    const inputC = `MutarUint32Array(${obj.array.join()})`;
    obj.convert(BigUint64Array);
    const outputC = obj.view.getBigUint64(0, true);
    const expectedC = 8022916924116329800n;
    
    if (outputC !== expectedC) {
        makeError(
            unit,
            "convertUpGetBigInt",
            inputC,
            outputC.toString(),
            expectedC.toString()
        );
    }

    // ------------------------------------------------ //
    // testD - convert back to Uint8, with trimming decode to utf-8-string
    // expect: original expectA "Hello World!"

    next();

    const inputD = `BigUint64Array(${obj.array.join()})`;
    obj.convert(Uint8Array, true);
    const outputD = new TextDecoder().decode(obj.array);
    
    if (outputD !== expectedA) {
        makeError(
            unit,
            "backToInitialStr",
            inputD,
            outputD,
            expectedA
        );
    }

    // ------------------------------------------------ //
    // testE - push
    // expect: "Hello World!!" after pushing and decoding

    next();

    const inputE = `MutarUint8Array(${obj.array.join()}).push(33)`
    obj.push(33);
    const expectedE = "Hello World!!";
    const outputE = new TextDecoder().decode(obj.array);

    if (outputE !== expectedE) {
        makeError(
            unit,
            "push",
            inputE,
            outputE,
            expectedE
        );
    }

    // ------------------------------------------------ //
    // testF - pop
    // expect: original expectA "Hello World!" + popped int 33
    
    next();

    const inputF = `MutarUint8Array(${obj.array.join()}).pop()`
    const popped = obj.pop();
    const outputF = new TextDecoder().decode(obj.array);

    if (!(outputF === expectedA && popped === 33)) {
        makeError(
            unit,
            "pop",
            inputF,
            `${outputF} && ${popped}`,
            `${expectedA} && 33`
        );
    }

    // ------------------------------------------------ //
    // testG - unshift
    // expect: "!Hello World!" after unshifting and decoding

    next();

    const inputG = `MutarUint8Array(${obj.array.join()}).unshift(33)`
    obj.unshift(33);
    const expectedG = "!Hello World!";
    const outputG = new TextDecoder().decode(obj.array);

    if (outputG !== expectedG) {
        makeError(
            unit,
            "unshift",
            inputG,
            outputG,
            expectedG
        );
    }

    // ------------------------------------------------ //
    // testH - shift
    // expect: original expectA "Hello World!" + popped int 33
    
    next();

    const inputH = `MutarUint8Array(${obj.array.join()}).shift()`
    const shifted = obj.shift();
    const outputH = new TextDecoder().decode(obj.array);

    if (!(outputF === expectedA && shifted === 33)) {
        makeError(
            unit,
            "shift",
            inputH,
            `${outputH} && ${shifted}`,
            `${expectedA} && 33`
        );
    }

    // ------------------------------------------------ //
    // testI - call build in function "reverse" from root
    // expect: decoded "!dlroW olleH"
    
    next();

    const inputI = `MutarUint8Array(${obj.array.join()}).reverse()`
    const reversed = obj.reverse();

    const outputI = new TextDecoder().decode(reversed);
    const expectedI = "!dlroW olleH";

    if (outputI !== expectedI) {
        makeError(
            unit,
            "buildInReverse",
            inputI,
            outputI,
            expectedI
        );
    }
}

function cloneForeign() {
    // Clone a foreign Uint8Array
    // expect: - Same values on clone as on original, 
    //         - modification should not impact original


    const unit = "cloneForeign";
    makeUnit(unit);
    
    result.tests++;
    result.units[unit].tests++;
    
    const inputA = "Molly";
    const expectedA = inputA;
    const inputArr = new TextEncoder().encode(expectedA);
    const decoder = new TextDecoder()
    const clone = Mutar.clone(inputArr);

    const outputA = decoder.decode(clone);
    const subTest = (outputA === expectedA);
    
    clone[0] = 68;
    const expectedB = "Dolly";
    const outputB = decoder.decode(clone);
    const outputC = decoder.decode(inputArr);

    if (!(subTest && outputB === expectedB && outputC === expectedA)) {
        makeError(
            unit,
            "staticClone",
            `Mutar.clone(new TextEncoder().encode('${inputA}'))`,
            `${outputA} && ${outputB} && ${outputC}`,
            `${expectedA} && ${expectedB} && ${expectedA}`
        );
    }
}    

function main() {
    typeTests();
    objTests();
    cloneForeign();
    
    console.log("results");

    if (!result.errors) delete result.errorMessages;
    console.log(JSON.stringify(result, null, 4));
    
    if (result.errors) {
        console.error(`${result.errors} error${(result.errors > 1) ? "s" : ""} occurred!`);
        return 1;
    }
    
    console.log("\nEverything seems to work fine.");
    return 0;
}

process.exit(main());
