document.addEventListener('DOMContentLoaded', function() {
  // Create the binary background element
  const binaryBg = document.createElement('div');
  binaryBg.style.position = 'fixed';
  binaryBg.style.top = '0';
  binaryBg.style.left = '0';
  binaryBg.style.width = '100%';
  binaryBg.style.height = '200%'; // extended height for continuous scrolling
  binaryBg.style.fontFamily = 'monospace';
  binaryBg.style.fontSize = '14px';
  binaryBg.style.color = '#ff00ff';
  binaryBg.style.opacity = '0.1';
  binaryBg.style.whiteSpace = 'pre';
  binaryBg.style.overflow = 'hidden';
  binaryBg.style.zIndex = '-2';
  // Set the binary text with line breaks
  binaryBg.textContent = "10101010101010101010\n01010101010101010101\n10101010101010101010\n01010101010101010101\n10101010101010101010\n01010101010101010101\n";
  document.body.appendChild(binaryBg);

  // Animate the vertical scroll of binaryBg using requestAnimationFrame
  let startTime = null;
  const scrollDuration = 10000; // 10 seconds for a complete cycle
  function animateBG(timestamp) {
    if (!startTime) startTime = timestamp;
    const progress = timestamp - startTime;
    const percent = (progress % scrollDuration) / scrollDuration; // cycle 0 to 1
    const translateY = -100 + percent * 200; // from -100% to 100%
    binaryBg.style.transform = `translateY(${translateY}%)`;
    requestAnimationFrame(animateBG);
  }
  requestAnimationFrame(animateBG);

  // Create a glitch overlay element on top of the binary background
  const glitchOverlay = document.createElement('div');
  glitchOverlay.style.position = 'fixed';
  glitchOverlay.style.top = '0';
  glitchOverlay.style.left = '0';
  glitchOverlay.style.width = '100%';
  glitchOverlay.style.height = '100%';
  glitchOverlay.style.pointerEvents = 'none'; // allow clicks to pass through
  glitchOverlay.style.zIndex = '-1';
  document.body.appendChild(glitchOverlay);

  // Clone the binary background to use for the glitch effect
  const glitchElem = binaryBg.cloneNode(true);
  glitchElem.style.position = 'absolute';
  glitchElem.style.top = '0';
  glitchElem.style.left = '0';
  glitchElem.style.opacity = '0.2';
  // Remove any previous transforms to let glitch animate independently
  glitchElem.style.transform = '';
  glitchOverlay.appendChild(glitchElem);

  // Glitch animation: randomly offset the glitch element every 500ms
  function triggerGlitch() {
    const randX = Math.random() * 10 - 5; // shift between -5 and 5 px
    const randY = Math.random() * 10 - 5;
    glitchElem.style.transform = `translate(${randX}px, ${randY}px)`;
    setTimeout(triggerGlitch, 500);
  }
  triggerGlitch();
});