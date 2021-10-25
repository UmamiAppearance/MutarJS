/* eslint-disable no-console */
import Mutar from "../src/Mutar.js";

const Encoder = new TextEncoder();
const Decoder = new TextDecoder();

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

function nextTest(unit) {
    result.tests++;
    result.units[unit].tests++;
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
        nextTest(unit);

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

    nextTest(unit);

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


    // ------------------------------------------------ //
    // testConset - conset (tests concat either)
    // expect: complete string "Hello World!" after decoding
    
    nextTest(unit);

    const arrayToConcat = new Uint8Array([87, 111, 114, 108, 100, 33]);

    obj.conset(arrayToConcat);

    // Decode the array
    const outputConset = Decoder.decode(obj.array);
    const expectedConset = "Hello World!";

    if (outputConset !== expectedConset) {
        makeError(
            unit,
            "conset",
            arrayToConcat,
            outputConset,
            expectedConset
        );
    }


    // ------------------------------------------------ //
    // testConvert - convert
    // expect: integer "4247253545" after conversion to Uint32 and addition of the 3 individual bytes
    
    nextTest(unit);

    // convert the array to Uint32 and join to string
    
    const inputConvert = `MutarUint8Array(${obj.array.join()})`;
    
    obj.convert(Uint32Array);
    
    // The view now has 3 Uint32 integers. Those are received
    // in LE byte order and added up. The result must be 
    // 4247253545

    const outputConvert = obj.view.getUint32(0, true) + obj.view.getUint32(4, true) + obj.view.getUint32(8, true);
    const expectedConvert = 4247253545;

    if (outputConvert !== expectedConvert) {
        makeError(
            unit,
            "convert",
            inputConvert,
            "Addition of 3 Uint32 -> ".concat(outputConvert),
            "Addition of 3 Uint32 -> ".concat(expectedConvert)
        );
    }


    // ------------------------------------------------ //
    // testCloneEquality - clone the Mutar obj
    // expect: A copy obj the whole object

    const clone = obj.clone();
    
    const inputCloneEquality = JSON.stringify(obj);
    const outputCloneEquality = JSON.stringify(clone);
    const expectedCloneEquality = inputCloneEquality;

    if (outputCloneEquality !== expectedCloneEquality) {
        makeError(
            unit,
            "cloneEquality",
            inputCloneEquality,
            outputCloneEquality,
            expectedCloneEquality
        );
    }


    // ------------------------------------------------ //
    // testConvertIntModeIntegrityError - convert intMode
    // expect: IntegrityError

    const inputConvertIntModeIntegrityError = `MutarUint32Array(${clone.array.join()})`;
    const expectedConvertIntModeIntegrityError = "IntegrityError";
    
    let outputConvertIntModeIntegrityError = "NoError"; 

    try {
        clone.convert("Uint8", false, true);
    } catch (e) {
        outputConvertIntModeIntegrityError = e.name;
    }

    if (outputConvertIntModeIntegrityError !== expectedConvertIntModeIntegrityError) {
        makeError(
            unit,
            "testConvertIntModeIntegrityError",
            inputConvertIntModeIntegrityError,
            outputConvertIntModeIntegrityError,
            expectedConvertIntModeIntegrityError
        );
    }


    // ------------------------------------------------ //
    // testConvertIntModeForce - convert intMode forcing
    // expect: string "Hor" after conversion and decoding

    const inputConvertIntModeForce = `MutarUint32Array(${clone.array.join()})`;
    const expectedConvertIntModeForce = "Hor";
    
    clone.convert("Uint8", false, "force");

    const outputConvertIntModeForce = Decoder.decode(clone.array); 

    if (outputConvertIntModeForce !== expectedConvertIntModeForce) {
        makeError(
            unit,
            "testConvertIntModeForce",
            inputConvertIntModeForce,
            outputConvertIntModeForce,
            expectedConvertIntModeForce
        );
    }

    // ------------------------------------------------ //
    // testConvertIntModeUp - convert intMode forcing
    // expect: string "Hor" after conversion and decoding

    const inputConvertIntModeUp = `MutarUint8Array(${clone.array.join()})`;
    const expectedConvertIntModeUp = "Hor";
    //TODO:
    clone.convert("Uint8", false, "force");

    const outputConvertIntModeUp = Decoder.decode(clone.array); 

    if (outputConvertIntModeUp !== expectedConvertIntModeUp) {
        makeError(
            unit,
            "testConvertIntModeUp",
            inputConvertIntModeUp,
            outputConvertIntModeUp,
            expectedConvertIntModeUp
        );
    }


    // ------------------------------------------------ //
    // testConvertBig - convert way up, get one BigUint
    // expect: BigUint "8022916924116329800n" at byte 0 (little endian)
    
    nextTest(unit);

    const inputCovertBig = `MutarUint32Array(${obj.array.join()})`;
    obj.convert(BigUint64Array);
    const outputConvertBig = obj.view.getBigUint64(0, true);
    const expectedConvertUp = 8022916924116329800n;
    
    if (outputConvertBig !== expectedConvertUp) {
        makeError(
            unit,
            "convertUpGetBigInt",
            inputCovertBig,
            outputConvertBig.toString(),
            expectedConvertUp.toString()
        );
    }

    // ------------------------------------------------ //
    // testConvertBack - convert back to Uint8, with trimming decode to utf-8-string
    // expect: original expectConset "Hello World!"

    nextTest(unit);

    const inputCovertBack = `MutarBigUint64Array(${obj.array.join()})`;
    obj.convert(Uint8Array, true);
    const outputConvertBack = Decoder.decode(obj.array);
    
    if (outputConvertBack !== expectedConset) {
        makeError(
            unit,
            "backToInitialStr",
            inputCovertBack,
            outputConvertBack,
            expectedConset
        );
    }

    // ------------------------------------------------ //
    // testPush - push
    // expect: "Hello World!!" after pushing and decoding

    nextTest(unit);

    const inputPush = `MutarUint8Array(${obj.array.join()}).push(33)`
    obj.push(33);
    const expectedPush = "Hello World!!";
    const outputPush = Decoder.decode(obj.array);

    if (outputPush !== expectedPush) {
        makeError(
            unit,
            "push",
            inputPush,
            outputPush,
            expectedPush
        );
    }

    // ------------------------------------------------ //
    // testPop - pop
    // expect: original expectConset "Hello World!" + popped int 33
    
    nextTest(unit);

    const inputPop = `MutarUint8Array(${obj.array.join()}).pop()`
    const popped = obj.pop();
    const outputPop = Decoder.decode(obj.array);

    if (!(outputPop === expectedConset && popped === 33)) {
        makeError(
            unit,
            "pop",
            inputPop,
            `${outputPop} && ${popped}`,
            `${expectedConset} && 33`
        );
    }

    // ------------------------------------------------ //
    // testUnshift - unshift
    // expect: "!Hello World!" after unshifting and decoding

    nextTest(unit);

    const inputUnshift = `MutarUint8Array(${obj.array.join()}).unshift(33)`
    obj.unshift(33);
    const expectedUnshift = "!Hello World!";
    const outputUnshift = Decoder.decode(obj.array);

    if (outputUnshift !== expectedUnshift) {
        makeError(
            unit,
            "unshift",
            inputUnshift,
            outputUnshift,
            expectedUnshift
        );
    }

    // ------------------------------------------------ //
    // testShift - shift
    // expect: original expectConset "Hello World!" + popped int 33
    
    nextTest(unit);

    const inputShift = `MutarUint8Array(${obj.array.join()}).shift()`
    const shifted = obj.shift();
    const outputShift = Decoder.decode(obj.array);

    if (!(outputPop === expectedConset && shifted === 33)) {
        makeError(
            unit,
            "shift",
            inputShift,
            `${outputShift} && ${shifted}`,
            `${expectedConset} && 33`
        );
    }

    // ------------------------------------------------ //
    // testBuildInAccess - call build in function "reverse" from root
    // expect: decoded "!dlroW olleH"
    
    nextTest(unit);

    const inputBuildInAccess = `MutarUint8Array(${obj.array.join()}).reverse()`
    const reversed = obj.reverse();

    const outputBuildInAccess = Decoder.decode(reversed);
    const expectedBuildInAccess = "!dlroW olleH";

    if (outputBuildInAccess !== expectedBuildInAccess) {
        makeError(
            unit,
            "buildInReverse",
            inputBuildInAccess,
            outputBuildInAccess,
            expectedBuildInAccess
        );
    }
}

function cloneForeign() {
    // Clone a foreign Uint8Array
    // expect: - Same values on clone as on original, 
    //         - modification should not impact original


    const unit = "cloneForeign";
    makeUnit(unit);
    nextTest(unit);
    
    const inputA = "Molly";
    const expectedA = inputA;
    const inputArr = Encoder.encode(expectedA);
    const decoder = Decoder
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
            `Mutar.clone(Encoder.encode('${inputA}'))`,
            `${outputA} && ${outputB} && ${outputC}`,
            `${expectedA} && ${expectedB} && ${expectedA}`
        );
    }

    // make one version for both clones and call separately
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
