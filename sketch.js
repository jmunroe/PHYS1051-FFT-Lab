let font, fontsize = 40;
let mic, fft;
let running = true;
let waveform, spectrum;
let osc, playing, freq, amp;

function preload() {
  // Ensure the .ttf or .otf font stored in the assets directory
  // is loaded before setup() and draw() are called
  font = loadFont('assets/SourceSansPro-Regular.otf');
}

function setup() {
  let cnv = createCanvas(windowWidth, windowHeight);

  // Set text characteristics
  textFont(font);
  textSize(fontsize);
  textAlign(CENTER, CENTER);

  mic = new p5.AudioIn();
  mic.start();
  fft = new p5.FFT(0.9, 8192);
  fft.setInput(mic);

  cnv.mousePressed(playOscillator);
  osc = new p5.Oscillator('sine');
  //fft.setInput(osc);
}

function draw() {
  if (running) {
    waveform = fft.waveform(512);
    spectrum = fft.analyze(4096);
  }

  background(220);

  let xmin = width * 0.05
  let xmax = width * 0.95

  stroke(255, 0, 0);
  strokeWeight(8);
  
  let trace = constrain(mouseX, xmin, xmax);
  line(trace, height * 0.55, trace, height * 0.96);

  let freqTrace = map(trace, xmin, xmax, 0, 1)*sampleRate()/8;
  freq = map(constrain(mouseX, xmin, xmax), xmin, xmax, 0, 1)*sampleRate()/8;
  amp = constrain(map(mouseY, height, 0, 0, 1), 0, 1);

  stroke(0);
  strokeWeight(4);
  fill(0);
  textSize(fontsize);
  textAlign(LEFT, BASELINE);
  text('Waveform', 10, 40);
  text('Spectrum', 10, height / 2);

  strokeWeight(1);
  textSize(14);
  textAlign(LEFT, BASELINE);
  text(`Frequency: ${freqTrace.toFixed(0)} Hz`, width * 0.5, height / 2);
  text(`sampleRate: \n${sampleRate()}`, width / 2, 20);
  
  // Draw the waveform
  strokeWeight(2);
  noFill();
  beginShape();
  for (i = 0; i < 512; i++) {
    let x = map(i, 0, 512, xmin, xmax);
    curveVertex(x, map(waveform[i], -1, 1, height / 2, 0));
  }
  endShape();

  noFill();
  beginShape();
  for (i = 0; i < 1024; i++) {
    let x = map(i, 0, 1024, xmin, xmax);

    curveVertex(x, map(spectrum[i], 0, 255, height * 0.95, height * 0.55));
  }
  endShape();

 
  strokeWeight(1);
  let msg;
  if (running) {
    msg = 'freeze';
  } else {
    msg = 'unfreeze';
  }
  text(`Press any key to ${msg} the spectrum analyzer.`, 
       width*0.05, 
       height*0.40);
  text('click to play tone', width * 0.7, 20);
  text(`freq: ${freq.toFixed(0)} Hz`, width * 0.7, 40);
  text(`amp: ${amp.toFixed(2)}`, width * 0.7, 60);

  if (playing) {
    if (osc.f > 0) {
      // smooth the transitions by 0.1 seconds
      // ramping requires current frequency to be positive
      osc.freq(freq, 0.1);
    } else {
      osc.freq(freq);
    }
    osc.amp(amp, 0.1);
  }
}

function playOscillator() {
  // starting an oscillator on a user gesture will enable audio
  // in browsers that have a strict autoplay policy.
  // See also: userStartAudio();
  osc.start();
  playing = true;
}

function mouseReleased() {
  // ramp amplitude to 0 over 0.5 seconds
  osc.amp(0, 0.5);
  playing = false;
}

function keyPressed() {
  running = !running;
}