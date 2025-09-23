let points = [];
let orderedPoints = [];
let algorithmRunning = false;
let speed = 1;
let stepDescriptions = [
  "1. Select the left-bottom point.",
  "2. Sort points by orientation (angle from base point), closest first (except last collinear group : furthest first).",
  "3. Link the points together in the computed order."
];
let currentStep = -1;
let basePoint = null;
let sortedPoints = [];
let highlightIndex = -1;
let autoStepInterval = null;

function setup() {
  createCanvas(600, 600).parent(document.body);
  createUI();
}

function draw() {
  background(240);

  // Draw points
  noStroke();
  for (let i = 0; i < points.length; i++) {
    // Highlight base point
    if (basePoint && points[i] === basePoint) {
      fill(255, 0, 0);
    }
    // After sorting, highlight sorted points with increasing color
    else if (algorithmRunning && currentStep === 2 && sortedPoints.length > 0) {
      let idx = sortedPoints.indexOf(points[i]);
      if (idx !== -1) {
        // Gradient from blue to orange
        let c = lerpColor(color(0, 150, 255), color(255, 140, 0), idx / (sortedPoints.length - 1));
        fill(c);
      } else {
        fill(0);
      }
    }
    // During sorting step, highlight sorted points
    else if (algorithmRunning && currentStep === 1 && sortedPoints.includes(points[i])) {
      fill(0, 150, 255);
    } else {
      fill(0);
    }
    ellipse(points[i].x, points[i].y, 10, 10);
  }

  // Draw lines for ordered points (step 3)
  if (algorithmRunning && currentStep >= 2 && orderedPoints.length > 1) {
    stroke(0, 100, 200);
    strokeWeight(2);
    noFill();
    beginShape();
    for (let pt of orderedPoints) {
      vertex(pt.x, pt.y);
    }
    endShape(CLOSE);
  }

  // Draw step visualizer
  drawStepVisualizer();
}

function mousePressed() {
  // Only add points if mouse is inside canvas and algorithm not running
  if (!algorithmRunning && mouseX >= 0 && mouseX <= width && mouseY >= 0 && mouseY <= height) {
    points.push(createVector(mouseX, mouseY));
  }
}

function createUI() {
  // Launch Algorithm button
  let launchBtn = createButton('Launch Algorithm');
  launchBtn.parent(document.body);
  launchBtn.mousePressed(() => {
    if (points.length < 3) {
      alert("Please add at least 3 points.");
      return;
    }
    algorithmRunning = true;
    currentStep = 0;
    basePoint = null;
    sortedPoints = [];
    orderedPoints = [];
    highlightIndex = -1;
    if (autoStepInterval) clearInterval(autoStepInterval);
    nextStep(); // Do the first step immediately
    autoStepInterval = setInterval(() => {
      if (algorithmRunning && currentStep < stepDescriptions.length) {
        nextStep();
      } else {
        clearInterval(autoStepInterval);
        autoStepInterval = null;
      }
    }, 1100 - speed * 100); // speed: 1 (slowest, 1000ms), 10 (fastest, 100ms)
  });

  // Reset Points button
  let resetBtn = createButton('Reset Points');
  resetBtn.parent(document.body);
  resetBtn.mousePressed(() => {
    points = [];
    algorithmRunning = false;
    currentStep = -1;
    basePoint = null;
    sortedPoints = [];
    orderedPoints = [];
    highlightIndex = -1;
    if (autoStepInterval) {
      clearInterval(autoStepInterval);
      autoStepInterval = null;
    }
  });

  // Next Step button
  let nextBtn = createButton('Next Step');
  nextBtn.parent(document.body);
  nextBtn.mousePressed(() => {
    if (algorithmRunning && currentStep < stepDescriptions.length) nextStep();
  });

  // Speed slider
  let speedLabel = createSpan('Speed: ');
  speedLabel.parent(document.body);
  let speedSlider = createSlider(1, 10, speed, 1);
  speedSlider.parent(document.body);
  let speedValue = createSpan(speed);
  speedValue.parent(document.body);

  speedSlider.input(() => {
    speed = speedSlider.value();
    speedValue.html(speed);
    // If running, update interval
    if (autoStepInterval) {
      clearInterval(autoStepInterval);
      autoStepInterval = setInterval(() => {
        if (algorithmRunning && currentStep < stepDescriptions.length) {
          nextStep();
        } else {
          clearInterval(autoStepInterval);
          autoStepInterval = null;
        }
      }, 1100 - speed * 100);
    }
  });

  // Style buttons and slider
  selectAll('button').forEach(btn => btn.style('margin', '5px'));
  speedSlider.style('margin', '0 10px 0 0');
  speedLabel.style('margin', '0 5px 0 15px');
  speedValue.style('margin', '0 10px 0 0');
}

function drawStepVisualizer() {
  let html = '<div class="step-visualizer">';
  for (let i = 0; i < stepDescriptions.length; i++) {
    html += `<div class="step-cell${i === currentStep ? ' active' : ''}">${stepDescriptions[i]}</div>`;
  }
  html += '</div>';
  select('#step-visualizer').html(html);
}

function nextStep() {
  if (currentStep === 0) {
    // Step 1: Select the left-bottom point (leftmost, then lowest y if tie)
    basePoint = points[0];
    for (let pt of points) {
      if (
        pt.x < basePoint.x ||
        (pt.x === basePoint.x && pt.y > basePoint.y)
      ) {
        basePoint = pt;
      }
    }
    highlightIndex = points.indexOf(basePoint);
    currentStep++;
  } else if (currentStep === 1) {
    // Step 2: Sort points by orientation and distance
    sortedPoints = points.slice();
    sortedPoints.sort((a, b) => {
      if (a === basePoint) return -1;
      if (b === basePoint) return 1;
      let angleA = atan2(a.y - basePoint.y, a.x - basePoint.x);
      let angleB = atan2(b.y - basePoint.y, b.x - basePoint.x);
      if (angleA !== angleB) return angleA - angleB;
      // Same angle: closest first, except for last collinear group (furthest first)
      let distA = dist(basePoint.x, basePoint.y, a.x, a.y);
      let distB = dist(basePoint.x, basePoint.y, b.x, b.y);
      return distA - distB;
    });

    // Handle last collinear group: furthest first
    let n = sortedPoints.length;
    let lastAngle = atan2(sortedPoints[n - 1].y - basePoint.y, sortedPoints[n - 1].x - basePoint.x);
    let group = [sortedPoints[n - 1]];
    for (let i = n - 2; i >= 0; i--) {
      let angle = atan2(sortedPoints[i].y - basePoint.y, sortedPoints[i].x - basePoint.x);
      if (abs(angle - lastAngle) < 1e-8) {
        group.push(sortedPoints[i]);
      } else {
        break;
      }
    }
    if (group.length > 1) {
      group.reverse();
      sortedPoints.splice(n - group.length, group.length, ...group);
    }
    orderedPoints = sortedPoints.slice();
    highlightIndex = -1;
    currentStep++;
  } else if (currentStep === 2) {
    // Step 3: Link the points together (already done)
    highlightIndex = -1;
    currentStep++;
    // Stop auto-stepping after last step
    if (autoStepInterval) {
      clearInterval(autoStepInterval);
      autoStepInterval = null;
    }
  }
}