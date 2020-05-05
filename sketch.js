// jshint esversion:6
// @ts-check

let sketch = function (p) {

  let font, fontsize = 40;
  let mic, fft;
  let running = true;
  let waveform, spectrum;
  let osc, playing, freq, amp;
  let waveformPlot;
  let waveformPoints = [];
  let plot;
  let spectrumPoints = [];

  let freezeButton;
  let oscCheck;

  p.preload = function() {
    // Ensure the .ttf or .otf font stored in the assets directory
    // is loaded before setup() and draw() are called
    font = p.loadFont('assets/SourceSansPro-Regular.otf');
  };

  p.setup = function() {
    let cnv = p.createCanvas(p.windowWidth, p.windowHeight);

    // Set text characteristics
    p.textFont(font);
    p.textSize(fontsize);
    p.textAlign(p.CENTER, p.CENTER);

    mic = new p5.AudioIn();
    mic.start();
    fft = new p5.FFT(0.9, 8192);
    osc = new p5.Oscillator('sine');

    // Create a new plot and set its position on the screen
    waveformPlot = new GPlot(p);
    waveformPlot.setPos(p.width * 0.05, p.height * 0.05);
    waveformPlot.setDim(p.width  *0.9, p.height * 0.37);

    waveformPlot.setYLim(-1, 1);
    waveformPlot.setXLim(0, 10);

    // Set the plot title and the axis labels
    waveformPlot.getXAxis().setAxisLabelText("Time (ms)");
    waveformPlot.setBgColor(0);
    waveformPlot.setBoxBgColor(220);
    waveformPlot.setPointSize(0);
    waveformPlot.setLineWidth(2);
    waveformPlot.setLineColor(0);
    waveformPlot.setBoxLineColor(220);
    waveformPlot.setMar(0,0,0,0);
    waveformPlot.getYAxis().setLineColor(220);
    waveformPlot.getYAxis().setTicks([]);
    waveformPlot.getXAxis().setNTicks(10);
  
    plot = new GPlot(p);
    plot.setPos(p.width * 0.05, p.height * 0.55);
    plot.setDim(p.width * 0.9, p.height * 0.37);

    plot.setYLim(0, 200);
    plot.setXLim(0, 4000);

    // Set the plot title and the axis labels
    plot.getXAxis().setAxisLabelText("Frequency (Hz)");
    plot.setBgColor(220);
    plot.setBoxBgColor(220);
    plot.setPointSize(0);
    plot.setLineWidth(2);
    plot.setLineColor(0);
    plot.setBoxLineColor(220);
    plot.setMar(0,0,0,0);
    plot.getYAxis().setLineColor(220);
    plot.getYAxis().setTicks([]);
    plot.getXAxis().setNTicks(10);

    freezeButton = myp5.createButton('Pause spectrum analyzer');
    freezeButton.position( p.width * 0.20, p.height * 0.08);
    freezeButton.mousePressed(toggleFreeze);
    
    let micinputCheck = p.createCheckbox('Use microphone as input', true);
    micinputCheck.changed( () =>  {
      if (micinputCheck.checked()) {
        mic.start();
      } else {
        mic.stop();
      }
    } );

    oscCheck = p.createCheckbox('Play oscillator tone', true);
    oscCheck.changed( () =>  {
      if (oscCheck.checked()) {
        osc.start();
      } else {
        osc.stop();
      }
    } );

    micinputCheck.position(p.width * 0.6, 15);
    oscCheck.position(p.width * 0.78, 15);

    fft.setInput(mic);
    fft.setInput(osc);

    cnv.mousePressed(playOscillator);
  };

  function toggleFreeze() {
    //freezeButton;
    running = !running;
    if (running) {
      freezeButton.elt.innerHTML = 'Pause spectrum analyzer';
    } else {
      freezeButton.elt.innerHTML = 'Unpause spectrum analyzer';
    }
  }

  p.draw = function() {

    if (running) {
      waveform = fft.waveform(512);
      spectrum = fft.analyze(4096);
    }

    p.background(220);

    let xmin = p.width * 0.05;
    let xmax = p.width * 0.95;

    // Draw the waveform
    for (let i = 0; i < 512; i++) {
      waveformPoints[i] = new GPoint(i / myp5.sampleRate() * 1000, waveform[i]);
    }
    waveformPlot.setPoints(waveformPoints);
    waveformPlot.defaultDraw();
   
    for (let i = 0; i < 1024; i++) {
      spectrumPoints[i] = new GPoint(i/1024* myp5.sampleRate() / 8,  spectrum[i]);
    }
    plot.setPoints(spectrumPoints);
    plot.defaultDraw();

    let trace = p.constrain(p.mouseX, xmin, xmax);
    let pos = plot.getPlotPosAt(trace, p.mouseY);
    let freqTrace = plot.mainLayer.xPlotToValue(pos[0]);
    
    p.stroke(255, 0, 0);
    p.strokeWeight(2);
    p.line(trace, p.height * 0.55, trace, p.height * 0.96);

    freq = freqTrace;
    amp = p.constrain(p.map(p.mouseY, p.height, 0, 0, 1), 0, 1);

    p.stroke(0);
    p.strokeWeight(4);
    p.fill(0);
    p.textSize(fontsize);
    p.textAlign(p.LEFT, p.BASELINE);
    p.text('Waveform', 10, 40);
    p.text('Spectrum', 10, p.height / 2);

    p.strokeWeight(1);
    p.textSize(14);
    p.textAlign(p.LEFT, p.BASELINE);
    let msg;
    if (running) {
      msg = 'freeze';
    } else {
      msg = 'unfreeze';
    }
    p.text(`Press any key to ${msg} the spectrum analyzer.`,
      p.width * 0.20,
      p.height * 0.06);

    p.text(`Frequency: ${freq.toFixed(0)} Hz`, p.width * 0.8, 50);
    p.text(`Amplitude: ${amp.toFixed(2)}`, p.width * 0.8, 70);
    p.text(`Frequency: ${freqTrace.toFixed(0)} Hz`, p.width * 0.8, p.height / 2 + 20);
    p.text(`Sample Rate: ${myp5.sampleRate()}`,p.width * 0.8, p.height / 2 + 40);

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
  };

  function playOscillator() {
    // starting an oscillator on a user gesture will enable audio
    // in browsers that have a strict autoplay policy.
    // See also: userStartAudio();
    if ( oscCheck.checked() )  {
      osc.start();
      playing = true;
    }
  }

  p.mouseReleased = function() {
    // ramp amplitude to 0 over 0.5 seconds
    osc.amp(0, 0.5);
    playing = false;
  };

  p.keyPressed = toggleFreeze;

};

let myp5 = new p5(sketch);