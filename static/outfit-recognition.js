// Before we can use COCO-SSD class we must wait for it to finish
// loading. Machine Learning models can be large and take a moment 
// to get everything needed to run.

/*async function load_model() {
  // Store the resulting model in the global scope of our app.
  var model = undefined;
  /*const model = await tf.loadLayersModel("http://127.0.0.1:8080/crashzone-main/Outfit-detection-model/fashion-recognotion-model.json");
  console.log("Model loaded");
  //return model;
}
load_model();*/

const video = document.getElementById('webcam');
const liveView = document.getElementById('liveView');
const demosSection = document.getElementById('demos');
const enableWebcamButton = document.getElementById('webcamButton');

const vw = Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0)
const vh = Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0)
var vidWidth = 0;
var vidHeight = 0;
var xStart = 0;
var yStart = 0;

// Check if webcam access is supported.
function getUserMediaSupported() {
  return !!(navigator.mediaDevices &&
    navigator.mediaDevices.getUserMedia);
}

// If webcam supported, add event listener to button for when user
// wants to activate it to call enableCam function
if (getUserMediaSupported()) {
  enableWebcamButton.addEventListener('click', enableCam);
} else {
  console.warn('getUserMedia() is not supported by your browser');
}

//Enable the live webcam view and start classification.
function enableCam(event) {
  // Only continue if the COCO-SSD has finished loading.
  if (!model) {
    return;
  }
  
  // Hide the button once clicked.
  enableWebcamButton.classList.add('removed');
  
  // getUsermedia parameters to force video but not audio.
  const constraints = {
    video: true
  };

  navigator.mediaDevices.getUserMedia({
    video: {
      facingMode: "environment"
    },
  }).then(stream => {
    let $video = document.querySelector('video');
    $video.srcObject = stream;
    $video.onloadedmetadata = () => {
      vidWidth = $video.videoHeight;
      vidHeight = $video.videoWidth;
      //The start position of the video (from top left corner of the viewport)
      xStart = Math.floor((vw - vidWidth) / 2);
      yStart = (Math.floor((vh - vidHeight) / 2)>=0) ? (Math.floor((vh - vidHeight) / 2)):0;
      $video.play();
      //Attach detection model to loaded data event:
      $video.addEventListener('loadeddata', predictWebcam);
    }
  });
}

var model = undefined;
model_url = 'http://127.0.0.1:8080/crashzone-main/Outfit-detection-model/fashion-recognotion-model.json';

//Function Loads the GraphModel type model of
async function loadModel() {
  model = await tf.loadLayersModel(model_url);
  console.log('Model loaded');
  //Enable start button:
  enableWebcamButton.classList.remove('invisible');
  enableWebcamButton.innerHTML = 'Start camera';
}
//Call load function
loadModel();

var children = [];

/*detectFromVideoFrame = (model, video) => {
  model.detect(video).then(predictions => {
    this.showDetections(predictions);

    requestAnimationFrame(() => {
      this.detectFromVideoFrame(model, video);
    });
  }, (error) => {
    console.log("Could not start the webcam")
    console.error(error)
  });
};*/

function predictWebcam() {
  // classifying a frame in the stream.
  model.detect(video).then(function (predictions) {
    // Remove any highlighting in previous frame.
    for (let i = 0; i < children.length; i++) {
      liveView.removeChild(children[i]);
    }
    children.splice(0);
    
    // loop through predictions and draw them to the live view if
    for (let n = 0; n < predictions.length; n++) {
      if (predictions[n].score > 0.66) {
        const p = document.createElement('p');
        p.innerText = predictions[n].class  + ' - with ' 
            + Math.round(parseFloat(predictions[n].score) * 100) 
            + '% accuracy.';
        p.style = 'margin-left: ' + predictions[n].bbox[0] + 'px; margin-top: '
            + (predictions[n].bbox[1] - 10) + 'px; width: ' 
            + (predictions[n].bbox[2] - 10) + 'px; top: 0; left: 0;';

        const highlighter = document.createElement('div');
        highlighter.setAttribute('class', 'highlighter');
        highlighter.style = 'left: ' + predictions[n].bbox[0] + 'px; top: '
            + predictions[n].bbox[1] + 'px; width: ' 
            + predictions[n].bbox[2] + 'px; height: '
            + predictions[n].bbox[3] + 'px;';

        liveView.appendChild(highlighter);
        liveView.appendChild(p);
        children.push(highlighter);
        children.push(p);
      }
    }
    // keep predicting when the browser is ready
    window.requestAnimationFrame(predictWebcam);
  });
}