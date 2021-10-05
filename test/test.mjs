import Mutar from "../src/Mutar.js";

const results = {
    total: 0,
    errors: 0,
    errorMessages: {},
    units: {}
};

function makeError(unit) {
    results.errors++;
    if (!(unit in results.units)) {
        results.units[unit] = {};
        results.errorMessages[unit] = {};
    }
    
}

function typeTest() {
    const unit = "type-test";
    const Uint8 = new Uint8Array(1);
    const expectation = "Uint8Array";

    results.total++;
    if (Mutar.typeFromInput(Uint8) !== expectation) {
        makeError(unit);
    }
}

function main() {
    typeTest();
}

main();
