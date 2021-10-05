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
    const IOpart = `Input: ${input}\nOutput: ${output}\nExpected: ${expected}`;
    results.errorMessages[unit][`#${results.errors}`] = `${subUnit}: ${IOpart}`;

    const message = `Error occurred while testing '${unit}' ('${subUnit}'):\n${IOpart}`;
    console.error(message);
}

function makeUnit(unit) {
    results.units[unit] = {
        errors: 0,
        tests: 0,
    };
    results.errorMessages[unit] = {}; 
}

function typeTest() {
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

function main() {
    typeTest();

    console.log(results);
}

main();
