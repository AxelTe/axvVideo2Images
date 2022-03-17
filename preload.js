const {
    contextBridge,
    ipcRenderer, 
} = require("electron");

window.addEventListener('DOMContentLoaded', () => {

    console.log("preload>>>");

    const replaceText = (selector, text) => {
        const element = document.getElementById(selector)
        if (element) element.innerText = text
    }

    for (const type of ['chrome', 'node', 'electron']) {
        replaceText(`${type}-version`, process.versions[type])
    }
})

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld(
    "api", {
        send: (channel, data) => ipcRenderer.send(channel, data),
        recieve: (channel, func) => ipcRenderer.on(
            channel,
            (event, ...args) => func(args)
        )
    }
);