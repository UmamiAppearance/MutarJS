/* eslint-disable complexity */
/* eslint-disable no-console */
import Mutar from "../src/Mutar.js";

const Decoder = new TextDecoder();

const result = {
    tests: 0,
    errors: 0,
    errorMessages: {},
    units: {}
};

// Helpers

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

// Test functions

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


function objConversionTests() {
    const unit = "object-conversions";
    
    // initialize object as little endian
    const obj = new Mutar("Hello ", null, true);

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
    
    const inputConvert = `MutarUint8Array(${obj.array.join()}).convert(Uint32Array)`;
    
    obj.convert(Uint32Array);
    
    // The view now has 3 Uint32 integers. Those are received
    // in LE byte order and added up. The result must be 
    // 4247253545

    const outputConvert = obj.view.getUint32(0, obj.littleEndian) + obj.view.getUint32(4, obj.littleEndian) + obj.view.getUint32(8, obj.littleEndian);
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

    nextTest(unit);

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

    nextTest(unit);

    const inputConvertIntModeIntegrityError = `MutarUint32Array(${clone.array.join()}).convert("Uint8", false, true)`;
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

    nextTest(unit);

    const inputConvertIntModeForce = `MutarUint32Array(${clone.array.join()}).convert("Uint8", false, "force")`;
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
    // testConvertIntModeUp - convert Uint8 to Uint16 intMode 
    // expect: 297 after adding up 3 Uint16 bytes

    nextTest(unit);

    const inputConvertIntModeUp = `MutarUint8Array(${clone.array.join()}).convert("Uint16", false, true)`;
    const expectedConvertIntModeUp = 297;

    clone.convert("Uint16", false, true);

    const outputConvertIntModeUp = clone.view.getUint16(0, obj.littleEndian) + clone.view.getUint16(2, obj.littleEndian) + clone.view.getUint16(4, obj.littleEndian);

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
    // testEndiannessChange - flipEndianness, get the first Uint16 integer as big endian (it is flipped back afterwards)
    // expect: string "18432|72"

    nextTest(unit);

    const inputEndiannessChange = `MutarUint16Array(${clone.array.join()}).flipEndianness()`;
    const expectedEndiannessChange = "18432|72";

    let outputEndiannessChange = `${clone.view.getUint16(0, false)}|`;
    clone.flipEndianness();
    outputEndiannessChange = outputEndiannessChange.concat(String(clone.view.getUint16(0, false)));
    clone.flipEndianness();

    if (outputEndiannessChange !== expectedEndiannessChange) {
        makeError(
            unit,
            "testEndiannessChange",
            inputEndiannessChange,
            outputEndiannessChange,
            expectedEndiannessChange
        );
    }


    // ------------------------------------------------ //
    // testConvertIntModeBack - convert Uint16 back to Uint8 intMode 
    // expect: former String "Hor" after converting back and decoding

    nextTest(unit);

    const inputConvertIntModeBack = `MutarUint16Array(${clone.array.join()}).convert("Uint8", false, true);`;

    clone.convert("Uint8", false, true);

    const outputConvertIntModeBack = Decoder.decode(clone.array);

    if (outputConvertIntModeBack !== expectedConvertIntModeForce) {
        makeError(
            unit,
            "testConvertIntModeBack",
            inputConvertIntModeBack,
            outputConvertIntModeBack,
            expectedConvertIntModeForce
        );
    }


    // ------------------------------------------------ //
    // testObjIntegrityAfterCloneMod - test if original object is untouched since equality test
    // expect: Inequality of clone and object

    nextTest(unit);
    
    const outputObjIntegrityAfterCloneMod = JSON.stringify(obj);
    const expectedObjIntegrityAfterCloneMod = inputCloneEquality;

    if (outputObjIntegrityAfterCloneMod !== expectedObjIntegrityAfterCloneMod) {
        makeError(
            unit,
            "objIntegrityAfterCloneMod",
            inputCloneEquality,
            outputObjIntegrityAfterCloneMod,
            expectedObjIntegrityAfterCloneMod
        );
    }


    // ------------------------------------------------ //
    // testConvertBig - convert way up, get one BigUint
    // expect: BigUint "8022916924116329800n" at byte 0 (little endian)
    
    nextTest(unit);

    const inputCovertBig = `MutarUint32Array(${obj.array.join()}).convert(BigUint64Array)`;
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

    const inputCovertBack = `MutarBigUint64Array(${obj.array.join()}).convert(Uint8Array, true)`;
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

function objAppendDelete(littleEndian) {
    const unit = "object-append-delete-values";
    makeUnit(unit);

    // initialize test obj
    const obj = new Mutar([100, 200, 300, 400, 500, 600, 700, 800], Uint32Array, littleEndian);
    
    // if the endianness differs from the one of the system, adjust the values 
    if (littleEndian !== obj.SYS_LITTLE_ENDIAN) {
        obj.flipEndianness(false);
    }

    // make a copy for integrity check at the very end
    const clone = obj.extractArrayClone();

    // ------------------------------------------------ //
    // testDetach - detach
    // expect: length of 7 + detached int 500

    nextTest(unit);

    const inputDetach = `MutarUint32Array(${obj.array.join()}).detach(4))`
    const detached = obj.detach(4);
    const expectedDetach = 7;
    const outputDetach = obj.length;

    if (!(outputDetach === expectedDetach && detached === 500)) {
        makeError(
            unit,
            "detach",
            inputDetach,
            outputDetach,
            expectedDetach
        );
    }


    // ------------------------------------------------ //
    // testInsert - insert
    // expect: obj.length of 8 + value 500 at index 4

    nextTest(unit);

    const inputInsert = `MutarUint32Array(${obj.array.join()}).insert(4, 500"))`;
    const expectedInsert = 8;
    obj.insert(4, 500);
    const outputInsert = obj.length;

    if (!(outputInsert === expectedInsert && obj.view.getUint32(16, littleEndian) === 500)) {
        makeError(
            unit,
            "Insert",
            inputInsert,
            outputInsert,
            expectedInsert
        );
    }


    // ------------------------------------------------ //
    // testPush - push
    // expect: 6600 as the result of adding all values after pushing

    nextTest(unit);

    const inputPush = `MutarUint32Array(${obj.array.join()}).push(900, 1000, 1100)`
    obj.push(900, 1000, 1100);
    const expectedPush = 6600
    const outputPush = obj.reduce((a, b) => a + b);

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
    // expect: sum of 3000 after 3 times of calling pop and adding the results
    
    nextTest(unit);

    const inputPop = `3 x MutarUint32Array(${obj.array.join()}).pop()`
    const expectedPop = 3000;
    let outputPop = obj.pop();
    outputPop += obj.pop();
    outputPop += obj.pop();


    if (outputPop !== expectedPop) {
        makeError(
            unit,
            "pop",
            inputPop,
            outputPop,
            expectedPop
        );
    }

    // ------------------------------------------------ //
    // testUnshift - unshift
    // expect: sum of 8589937892 after reducing and addition (it ia so big,
    // because of the negative values added to an unsigned array)

    nextTest(unit);

    const inputUnshift = `MutarUint32Array(${obj.array.join()}).unshift(-200, -100, 0)`;
    obj.unshift(-200, -100, 0);
    const expectedUnshift = 8589937892;
    const outputUnshift = obj.reduce((a, b) => a + b);

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
    // expect: original array
    
    nextTest(unit);

    const inputShift = `3 x MutarUint32Array(${obj.array.join()}).shift()`;
    for (let i=3; i--;) {
        obj.shift();
    }
    const outputShift = (obj.length === clone.length && obj.array.every((val, i) => val === clone[i]));

    if (!outputShift) {
        makeError(
            unit,
            "shift",
            inputShift,
            `Uint32Array(${obj.array.join()})`,
            `Uint32Array(${clone.join()})`
        );
    }
}


function main() {
    typeTests();
    objConversionTests();
    for (const littleEndian of [true, false]) {
        objAppendDelete(littleEndian);
    }
    
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
