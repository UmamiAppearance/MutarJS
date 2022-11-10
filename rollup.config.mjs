import terser from "@rollup/plugin-terser";

export default {
    input: "src/Mutar.js",
    output: [ 
        {   
            format: "iife",
            name: "Mutar",
            file: "dist/Mutar.iife.js"
        },
        {   
            format: "iife",
            name: "Mutar",
            file: "dist/Mutar.iife.min.js",
            plugins: [terser()]
        },
        {   
            format: "es",
            name: "Mutar",
            file: "dist/Mutar.esm.js"
        },
        {   
            format: "es",
            name: "Mutar",
            file: "dist/Mutar.esm.min.js",
            plugins: [terser()]
        },
    ]
};
