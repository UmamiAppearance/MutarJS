/* eslint-disable no-console */
import Mutar from "../src/Mutar.js";

const results = {
    tests: 0,
    errors: 0,
    errorMessages: {},
    units: {}
};

function makeError(unit, subUnit, input, output, expected) {
    results.errors++;
    results.units[unit].errors++;
    results.errorMessages[unit][`#${results.errors}`] = {
        "sub-unit": subUnit,
        input: input,
        output: output,
        expected: expected
    };
    const message = `Error occurred while testing '${unit}' ('${subUnit}'):\nInput: ${input}\nOutput: ${output}\nExpected: ${expected}`;
    console.error(message);
}

function makeUnit(unit) {
    results.units[unit] = {
        errors: 0,
        tests: 0,
    };
    results.errorMessages[unit] = {}; 
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
        results.tests++;
        results.units[unit].tests++;

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

    results.tests++;
    results.units[unit].tests++;

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

    // ------------------------------------------------ //
    // testA - conset (tests concat either)

    makeUnit(unit);
    results.tests++;
    results.units[unit].tests++;
    
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
    
    // convert the array to Uint32 and join to string
    
    const inputB = `Uint8Array(${obj.array.join()})`;
    
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
    // testB - convert more up and back

    obj.convert(BigUint64Array);
    console.log(obj.array);
    console.log(obj.view.getBigUint64(0, true))
    // 8022916924116329800n
    obj.convert(Uint8Array);
    console.log(obj.array);

}

function main() {
    typeTests();
    objTests();
    console.log(JSON.stringify(results, null, 4));
}

main();
