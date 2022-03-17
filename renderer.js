// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// No Node.js APIs are available in this process because
// `nodeIntegration` is turned off. Use `preload.js` to
// selectively enable features needed in the rendering
// process.

var video = document.getElementById("videoInput");
var videoInFlag = false;
var outputPath = undefined;
var outputPathFlag = false;
var rows0, cols0, rows, cols;
var cvImg;
var fcnt = 0, pt0 = 0, ptime = 0, ptmin = 1000, ptmax =0;
var processVideoTOutID = null;
var capTime = 100;
var scaleDown = 1;

//
// buttons
//

// load ------------
//
document.getElementById("loadVideoBtn").addEventListener("click", onLoadBtnClicked, false);
function onLoadBtnClicked(ev) {
    console.log("loadVideoBtn()");
    //
    window.api.send("loadVideoFile");
}

// ipcRenderer.on becomes api.recieve
window.api.recieve("loadVideoFileAnswer", (msg) => {
    //handle on download-progress event
    console.log("window.api.recieve: loadVideoFileAnswer: " + msg[0].fname);
    video.src = msg[0].fname;
});

// output path ------------
//
document.getElementById("loadPathOutBtn").addEventListener("click", loadPathOutBtnClicked, false);
function loadPathOutBtnClicked() {
    console.log("loadPathOutBtnClicked()");
    //
    window.api.send("loadOutputPath");
}

// ipcRenderer.on becomes api.recieve
window.api.recieve("loadOutputPathAnswer", (msg) => {
    //handle on download-progress event
    //console.log("window.api.recieve: loadOutputPath: " + msg[0].fname);
    outputPath = msg[0].fname;
    let tstr = document.getElementById("statusLine2").innerHTML;
    document.getElementById("statusLine2").innerHTML = tstr + outputPath;
    document.getElementById("loadPathOutBtn").style.backgroundColor = "lightseagreen";
    outputPathFlag = true;
});

// sart ------------
//
document.getElementById("startBtn").disabled = true;
document.getElementById("startBtn").addEventListener("click", onStartBtnClicked, false);
function onStartBtnClicked() {
    console.log("onStartBtnClicked()");
    //
    // play the video
    video.play();
    // start process
    processVideoTOutID = setTimeout(processVideo, capTime);
}

// scale down -----
//
document.getElementById("scaleDownSelect").value = "1";
scaleDown = 2;
document.getElementById("scaleDownSelect").addEventListener("change", onscaleDownSelectChange, false);
function onscaleDownSelectChange(ev) {
    console.log("onscaleDownSelectChange(): " + ev.target.value);
    let val = parseInt(ev.target.value);
    if (isNaN(val) === false) {
        scaleDown = Math.pow(2, val);
        video.load();
    }

}

// capTimeSelect ---
//
document.getElementById("capTimeSelect").value = "1";
scaleDown = 40;
document.getElementById("capTimeSelect").addEventListener("change", capTimeSelectChange, false);
function capTimeSelectChange(ev) {
    console.log("capTimeSelectChange(): " + ev.target.value);
    let val = parseInt(ev.target.value);
    if (isNaN(val) === false) {
        capTime = Math.pow(2, (val+1))*10;
        video.load();
    }

}

//
// listeners
//
video.addEventListener('canplay', function () {
    // Video is loaded and can be played
    rows0 = this.videoHeight;
    cols0 = this.videoWidth;
    let tstr = video.src+ " loaded -- ";
    videoDuration = video.duration*1000;
    document.getElementById('statusLine1').innerHTML = tstr + "W:" + cols0 + ", H:" + rows0 + ", time:" + video.duration + "s";
    rows = Math.round(rows0 / scaleDown);
    cols = Math.round(cols0 / scaleDown);
    tstr = "output: ";
    let nofs = Math.round(videoDuration / capTime);
    document.getElementById('statusLine3').innerHTML = tstr + "W:" + cols + ", H:" + rows + ", cap.time:" + capTime + "s, expect no. frames: " + nofs;
    video.width = cols;
    video.height = rows;
    //
    canvas.width = cols;
    canvas.height = rows;
    //
    document.getElementById("loadVideoBtn").style.backgroundColor = "lightseagreen";
    videoInFlag = true;
}, false);

video.addEventListener('ended', function () {
    document.getElementById('statusLine1').innerHTML = "video ended ";
    if (processVideoTOutID !== null) {
        clearTimeout(processVideoTOutID);
        processVideoTOutID = null;
    }
});

//
// functions
//
function processVideo() {
    video.pause();
    pt0 = Date.now();
    let ctx0 = canvas.getContext('2d');
    // start processing
    ctx0.drawImage(video, 0, 0, cols, rows);
    let img = ctx0.getImageData(0, 0, cols, rows);
    window.api.send("saveimage", { img: img, cols: cols, rows: rows, path: outputPath, name: "img_" + fcnt + ".jpg" });
    //
};

// ipcRenderer.on becomes api.recieve
window.api.recieve("saveimageAnswer", (msg) => {
    //handle on download-progress event
    //console.log("window.api.recieve: loadOutputPath: " + msg[0].fname);
    fcnt++;
    let t = Date.now() - pt0;
    ptime += t;
    ptmax = ptmax < t ? t : ptmax;
    ptmin = ptmin > t ? t : ptmin;
    // schedule the next one.
    video.play();
    processVideoTOutID = setTimeout(processVideo, capTime);
});

// periodically called process control
setInterval(function () {
    // prove, if we ear ready to start video streaming
    if (videoInFlag && outputPathFlag) {
        document.getElementById("startBtn").disabled = false;
    }
    //
    if (fcnt > 0) {
        let t = ptime / fcnt;
        let vt = fcnt * capTime / 1000;
        let tstr = "video time: " + vt.toFixed(2) + "s";
        tstr += " -- fcnt: " + fcnt + ", ptime: " + t.toFixed(2) + ", max: " + ptmax + ", min: " + ptmin;
        document.getElementById('statusLine4').innerHTML = tstr;
    }
}, 100);


//
