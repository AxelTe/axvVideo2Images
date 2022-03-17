// Modules to control application life and create native browser window
const { app, BrowserWindow, ipcMain, dialog, Menu, Tray } = require('electron')
const path = require('path')
const sharp = require('sharp');


function createWindow () {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js')
    }
  })

  // and load the index.html of the app.
  mainWindow.loadFile('index.html')

  // Open the DevTools.
  // mainWindow.webContents.openDevTools()

    //
    ipcMain.on('loadVideoFile', async (event, ...args) => {
        let result = await loadVideoFile();
        console.log("loadVideoFile() done");
        mainWindow.webContents.send('loadVideoFileAnswer', result);
    })

    //
    ipcMain.on('loadOutputPath', async (event, ...args) => {
        let result = await loadOutputPath();
        console.log("loadOutputPath() done");
        mainWindow.webContents.send('loadOutputPathAnswer', result);
    })

    //
    ipcMain.on('saveimage', async (event, ...args) => {
        let result = await saveimage(args[0]);
        //@@@ console.log("saveimage() done");
        mainWindow.webContents.send('saveimageAnswer', result);
    })

}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit()
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.

function loadVideoFile() {
    console.log("loadVideoFile");
    return new Promise((resolve, rejected) => {
        dialog.showOpenDialog({
            properties: ['openFile'], filters: [{ name: 'videos', extensions: ['mp4'] }]
        }).then(result => {
            if (result.canceled === false) {
                resolve({ fname: result.filePaths[0] });
            }
        }).catch(err => {
            console.log(err)
            rejected(null);
        });
    })
}

function loadOutputPath() {
    console.log("loadOutputPath");
    return new Promise((resolve, rejected) => {
        dialog.showOpenDialog({
            properties: ['openDirectory']
        }).then(result => {
            if (result.canceled === false) {
                resolve({ fname: result.filePaths[0] });
            }
        }).catch(err => {
            console.log(err)
            rejected(null);
        });
    })
}

function saveimage(msg) {
    //@@@ console.log("saveimage");
    return new Promise((resolve, rejected) => {
        let fname = msg.path + "/" + msg.name;
        let img = msg.img;
        let len = msg.cols * msg.rows;
        let buf = new Uint8Array(3 * len);
        let k, l, j;
        k = 0;
        l = 0;
        for (i = 0; i < len; i++) {
            buf[k    ] = img.data[l];
            buf[k + 1] = img.data[l + 1];
            buf[k + 2] = img.data[l + 2];
            k += 3;
            l += 4;
        }
        const shInp = sharp(buf, { raw: { width: msg.cols, height: msg.rows, channels: 3 } });
        shInp.jpeg({ quality: 100, chromaSubsampling: '4:4:4' });
        shInp.toFile(fname)
            .then(info => {
                resolve("done");
            })
            .catch(err => {
                rejected(err);
            });
    });
}
