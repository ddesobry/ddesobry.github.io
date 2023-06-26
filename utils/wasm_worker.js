importScripts('out.js');

let wasmReady = false;
let queue = [];

// Wait for the WASM module to initialize
Module.onRuntimeInitialized = async _ => {
    wasmReady = true;
    processQueue();
};

function processQueue() {
    while (queue.length) {
        const task = queue.shift();
        const processedContent = Module.processFileContent(task.contents);
        postMessage({command: "processed", processedContent: processedContent});
    }
}

onmessage = function(e) {
    console.log("New message: ", e.data.command)
    if (e.data.command === "read") {
        if (wasmReady) {
            const processedContent = Module.processFileContent(e.data.contents);
            postMessage({command: "processed", processedContent: processedContent});
        } else {
            queue.push(e.data);
        }
    }
    else if(e.data.command === "loadMesh"){
        if (wasmReady) {
            const objContents = Module.loadAndSetState(e.data.contents);
            postMessage({command: "meshLoaded", contents: objContents});
        } else {
            queue.push(e.data);
        }
    }
    else if(e.data.command === "computeFF"){
        if (wasmReady) {
            const objContents = Module.computeFF(e.data.contents);
            postMessage({command: "computeFF", contents: objContents});
        } else {
            queue.push(e.data);
        }
    }
    else if(e.data.command === "computeParam"){
        if (wasmReady) {
            const objContents = Module.computeParam(e.data.contents);
            postMessage({command: "computeParam", contents: objContents});
        } else {
            queue.push(e.data);
        }
    }
    else if(e.data.command === "computeQuantization"){
        if (wasmReady) {
            const objContents = Module.computeQuantization(e.data.contents);
            postMessage({command: "computeQuantization", contents: objContents});
        } else {
            queue.push(e.data);
        }
    }
    else if(e.data.command === "computeQuads"){
        if (wasmReady) {
            const objContents = Module.computeQuads(e.data.contents);
            postMessage({command: "computeQuads", contents: objContents});
        } else {
            queue.push(e.data);
        }
    }
};