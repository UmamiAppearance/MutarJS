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

function appendEndiannessStr(name, littleEndian) {
    const endianness = (littleEndian) ? "LE" : "BE";
    return `${name}-${endianness}`;
}

function areEqual(itemA, itemB) {
    if (typeof(itemA) === "object") {
        return itemA.length === itemB.length && itemA.every((val, i) => val === itemB[i]);
    }
    return (itemA === itemB);
}

// Test functions

function typeTests() {
    /*
        Tests for the simple functions of type 
        conversions and type analysis.
    */
   
    const unit = "type-test";
    makeUnit(unit);

    // initialize test object
    const Uint8 = new Uint8Array(1);

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


function objPrimitiveRoutings() {
    const unit = "object-primitive-routings"
    makeUnit(unit);

    // Initialize test object
    const obj = new Mutar("dlroWolleH");


    // ------------------------------------------------------------------------------------------------ //
    // testSlice - call build in function "slice" from root
    // expect: decoded "Wolle" (german word for wool)
    
    nextTest(unit);

    const inputSlice = `MutarUint8Array(${obj.array.join()}).slice(4, -1)`;
    const slice = obj.slice(4, -1);
    const expectedSlice = "Wolle";
    const outputSlice = Decoder.decode(slice);

    if (outputSlice !== expectedSlice) {
        makeError(
            unit,
            "slice",
            inputSlice,
            outputSlice,
            expectedSlice
        );
    }


    // ------------------------------------------------------------------------------------------------ //
    // testReverse - call build in function "reverse" from root
    // expect: decoded "HelloWorld"
    
    nextTest(unit);

    const inputReverse = `MutarUint8Array(${obj.array.join()}).reverse()`
    obj.reverse();

    const outputReverse = Decoder.decode(obj.array);
    const expectedReverse = "HelloWorld";

    if (outputReverse !== expectedReverse) {
        makeError(
            unit,
            "reverse",
            inputReverse,
            outputReverse,
            expectedReverse
        );
    }


    // ------------------------------------------------------------------------------------------------ //
    // testCopyWithin - call build in function "copyWithin" from root
    // expect: decoded "HelloHello"
    
    nextTest(unit);

    const inputCopyWithin = `MutarUint8Array(${obj.array.join()}).copyWithin(5, 0, 5)`
    obj.copyWithin(5, 0, 5);

    const outputCopyWithin = Decoder.decode(obj.array);
    const expectedCopyWithin = "HelloHello";

    if (outputCopyWithin !== expectedCopyWithin) {
        makeError(
            unit,
            "copyWithin",
            inputCopyWithin,
            outputCopyWithin,
            expectedCopyWithin
        );
    }


    // ------------------------------------------------------------------------------------------------ //
    // testSubarray - call build in function "subarray" from root
    // expect: decoded "HelloolleH" after reversing the subarray
    
    nextTest(unit);

    const inputSubarray = `MutarUint8Array(${obj.array.join()}).subarray(5).reverse()`
    const sub = obj.subarray(5);
    sub.reverse();

    const outputSubarray = Decoder.decode(obj.array);
    const expectedSubarray = "HelloolleH";

    if (outputSubarray !== expectedSubarray) {
        makeError(
            unit,
            "subarray",
            inputSubarray,
            outputSubarray,
            expectedSubarray
        );
    }


    // ------------------------------------------------------------------------------------------------ //
    // testKeys - call build in function "keys" from root
    // expect: string "0123456789" after joining keys iterator
    
    nextTest(unit);

    const inputKeys = `MutarUint8Array(${obj.array.join()}).keys().join("")`
    const outputKeys = [...obj.keys()].join("");
    const expectedKeys = "0123456789";

    if (outputKeys !== expectedKeys) {
        makeError(
            unit,
            "keys",
            inputKeys,
            outputKeys,
            expectedKeys
        );
    }
}

/**
 * Tests the following functions:
 * at
 * entries
 * every
 * fill
 * filter
 * find
 * findIndex
 * forEach
 * includes
 * indexOf
 * join
 * lastIndexOf
 * map
 * reduce
 * reduceRight
 * reverse
 * set
 * slice
 * some
 * sort
 * toLocaleString
 * toString
 * values
 */
function objRewrittenBuildIns(littleEndian) {
    const unit = appendEndiannessStr("rewritten-build-ins", littleEndian);
    makeUnit(unit);

    // Initialize test object
    const obj = new Mutar(new Uint32Array([0, 11, 22, 33, 44, 55, 66, 77, 88, 99]), null, littleEndian, true);
    
    const switchOrig = (littleEndian !== obj.SYS_LITTLE_ENDIAN);

    if (switchOrig) {
        obj.flipEndianness(false);
    }
    
    const cloneA = obj.clone();
    const cloneB = obj.clone();

    console.log("OBJ ......", obj.array);

    function test(fn, subUnit, input, inputStr) {
        const passed = fn(input);
        if (!passed) {
            makeError(
                unit,
                subUnit,
                inputStr.replaceAll("INPUT", input),
                passed,
                true
            )
        }
    }

    function switchOutputEndiannessInt(output) {
        if (switchOrig) {
            return Mutar.flipEndiannessInt(output, "Uint32Array");
        }
        return output;
    }

    function switchOutputEndiannessArray(testObj) {
        if (switchOrig) {
            return Mutar.flipEndianness(testObj, true);
        }
        return testObj;
    }


    const routine = {
        at: {
            fn: (input) => areEqual(obj.at(input), switchOutputEndiannessInt(obj.array.at(input))),
            input: 2,
            inputStr: "obj.at(INPUT) === obj.array.at(INPUT)",
        },
        entries: {
            fn: () => areEqual([...obj.entries()].toString(), [...switchOutputEndiannessArray(obj.array).entries()].toString()),
            input: "",
            inputStr: "obj.entries() === obj.array.entries()",
        },
        every: {
            fn: (input) => areEqual(obj.every(input), switchOutputEndiannessArray(obj.array).every(input)),
            input: (val) => val < 100,
            inputStr: "obj.every(val < 100) === obj.array.every(val < 100)",
        },
        fill: {
            fn: (input) => areEqual(cloneA.fill(input), cloneB.array.fill(switchOutputEndiannessInt(input))),
            input: 100,
            inputStr: "cloneA.fill(INPUT) === cloneB.array.fill(INPUT)",
        },
        filter: {
            fn: (input) => areEqual(obj.filter(input), switchOutputEndiannessArray(obj.array).filter(input)),
            input: (val) => val > 44,
            inputStr: "obj.filter(val > 44) === obj.array.filter(val > 44)",
        },
        find: {
            fn: (input) => areEqual(obj.find(input), switchOutputEndiannessArray(obj.array).find(input)),
            input: (val) => val > 40,
            inputStr: "obj.find(val > 40) === obj.array.find(val > 40)",
        },
        findIndex: {
            fn: (input) => areEqual(obj.find(input), switchOutputEndiannessArray(obj.array).find(input)),
            input: (val) => val > 40,
            inputStr: "obj.find(val > 40) === obj.array.find(val > 40)",
        },
        forEach: {
            fn: () => {
                obj.forEach((val, i) => {
                    cloneA.view.setUint32(i*4, val, littleEndian);
                });
                obj.array.forEach((val, i) => {
                    cloneB.view.setUint32(i*4, val, obj.SYS_LITTLE_ENDIAN);
                });
                return areEqual(cloneA.array, cloneB.array);
            },
            input: null,
            inputStr: "obj.forEach((val => cloneA.view.setUint32) === obj.array.forEach((val => cloneB.view.setUint32)",
        }
    }

    for (const subUnit in routine) {
        if (Object.prototype.hasOwnProperty.call(routine, subUnit)) {
            const śubUnitObj = routine[subUnit];
            test(śubUnitObj.fn, subUnit, śubUnitObj.input, śubUnitObj.inputStr);
        } else {
            throw new Error("Failure in test routine. This is a bug. Testing aborted.");
        }
    }
}


function objConversionTests() {
    const unit = "object-conversions";
    makeUnit(unit);
    
    // initialize object as little endian
    const obj = Mutar.from("Hello ", null, true);


    // ------------------------------------------------------------------------------------------------ //
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


    // ------------------------------------------------------------------------------------------------ //
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


    // ------------------------------------------------------------------------------------------------ //
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


    // ------------------------------------------------------------------------------------------------ //
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


    // ------------------------------------------------------------------------------------------------ //
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


    // ------------------------------------------------------------------------------------------------ //
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


    // ------------------------------------------------------------------------------------------------ //
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


    // ------------------------------------------------------------------------------------------------ //
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


    // ------------------------------------------------------------------------------------------------ //
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


    // ------------------------------------------------------------------------------------------------ //
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

    // ------------------------------------------------------------------------------------------------ //
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
}

function objAppendDelete(littleEndian) {
    const unit = appendEndiannessStr("object-append-delete-values", littleEndian);
    makeUnit(unit);

    // initialize test obj
    const obj = new Mutar([100, 200, 300, 400, 500, 600, 700, 800], Uint32Array, littleEndian);
    
    // if the endianness differs from the one of the system, adjust the values 
    if (littleEndian !== obj.SYS_LITTLE_ENDIAN) {
        obj.flipEndianness(false);
    }

    // make a copy for integrity check at the very end
    const clone = obj.extractArrayClone();


    // ------------------------------------------------------------------------------------------------ //
    // testSplice - splice
    // expect: string "1002004050607080400500600700800" after joining without separator

    nextTest(unit);

    const inputSplice = `MutarUint32Array(${obj.array.join()}).splice(2, 1, 40, 50, 60, 70, 80)`;
    const expectedSplice = "1002004050607080400500600700800";
    
    obj.splice(2, 1, 40, 50, 60, 70, 80);

    const outputSplice = obj.join("");

    if (outputSplice !== expectedSplice) {
        makeError(
            unit,
            "splice",
            inputSplice,
            outputSplice,
            expectedSplice
        );
    }


    // ------------------------------------------------------------------------------------------------ //
    // testSpliceRestore - splice
    // expect: a spliced array with length of 5 and a sum 300 by adding all elements 

    nextTest(unit);

    const inputSpliceRestore = `MutarUint32Array(${obj.array.join()}).splice(2, 5, 300)`;
    const expectedSpliceRestore = 300;
    
    // store output as a Mutar object to handle endianness correctly
    const spliced = Mutar.from(obj.splice(2, 5, 300), null, littleEndian);

    const outputSpliceRestore = spliced.reduce((a, b) => a + b);

    if (!(outputSpliceRestore === expectedSpliceRestore && spliced.length === 5)) {
        makeError(
            unit,
            "splice",
            inputSpliceRestore,
            outputSpliceRestore,
            expectedSpliceRestore
        );
    }


    // ------------------------------------------------------------------------------------------------ //
    // testDetach - detach
    // expect: length of 7 + detached int 500

    nextTest(unit);

    const inputDetach = `MutarUint32Array(${obj.array.join()}).detach(4))`
    const detached = obj.detach(4);
    const expectedDetach = [7, 500];
    const outputDetach = [obj.length, detached];

    if (!(outputDetach[0] === expectedDetach[0] && outputDetach[1] === expectedDetach[1])) {
        makeError(
            unit,
            "detach",
            inputDetach,
            outputDetach,
            expectedDetach
        );
    }


    // ------------------------------------------------------------------------------------------------ //
    // testInsert - insert
    // expect: obj.length of 8 + value 500 at index 4

    nextTest(unit);

    const inputInsert = `MutarUint32Array(${obj.array.join()}).insert(4, 500"))`;
    const expectedInsert = [8, 500];
    obj.insert(4, 500);
    const outputInsert = [obj.length, obj.view.getUint32(16, littleEndian)];

    if (!(outputInsert[0] === expectedInsert[0] && outputInsert[1] === expectedInsert[1])) {
        makeError(
            unit,
            "Insert",
            inputInsert,
            outputInsert,
            expectedInsert
        );
    }


    // ------------------------------------------------------------------------------------------------ //
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

    // ------------------------------------------------------------------------------------------------ //
    // testPop - pop
    // expect: sum of 3000 after 3 times of calling pop and adding the results
    
    nextTest(unit);

    const inputPop = `3 x MutarUint32Array(${obj.array.join()}).pop()`
    const expectedPop = 3000;
    
    let outputPop = 0;
    
    for (let i=3; i--;) {
        outputPop += obj.pop();
    }

    if (outputPop !== expectedPop) {
        makeError(
            unit,
            "pop",
            inputPop,
            outputPop,
            expectedPop
        );
    }

    // ------------------------------------------------------------------------------------------------ //
    // testUnshift - unshift
    // expect: sum of 8589937892 after reducing and addition (it is so
    // big, because of the negative values added to an unsigned array)

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

    // ------------------------------------------------------------------------------------------------ //
    // testShift - shift
    // expect: original array
    
    nextTest(unit);

    const inputShift = `3 x MutarUint32Array(${obj.array.join()}).shift()`;
    for (let i=3; i--;) {
        obj.shift();
    }
    const outputShift = areEqual(obj.array, clone);

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
    
    objPrimitiveRoutings();

    for (const littleEndian of [true, false]) {
        objRewrittenBuildIns(littleEndian);
    }
    
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
