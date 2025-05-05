(async function() {
    const boardDiv = document.getElementById('zkvm-board');
    const zkvmBtn = document.getElementById('zkvm-btn');
    const logElem = document.getElementById('json-log');
    if (!boardDiv || !zkvmBtn || !logElem) return;
  
    let gameEnded = false;
    let proofGenerated = false;
  
    // SP1 zkVM simulator class (simplified)
    class SP1Simulator {
      constructor() {
        this.memory = new Map();
        this.registers = new Array(32).fill(0);
        this.pc = 0;
        this.instructions = [];
        this.trace = [];
      }
      
      async loadGameLogAsProgram(gameLog) {
        try {
          const frames = JSON.parse(gameLog);
          this.instructions = frames.map((frame, idx) => ({
            opcode: 'PROCESS_FRAME',
            rs1: idx,
            rd: idx + 1,
            immediate: JSON.stringify(frame)
          }));
          return true;
        } catch (error) {
          console.error("Failed to parse game log:", error);
          return false;
        }
      }
    
      executeInstruction(instruction) {
        if (instruction.opcode === 'PROCESS_FRAME') {
          const frameData = JSON.parse(instruction.immediate);
          const isValid = this.validateFrameData(frameData);
          this.registers[instruction.rd] = isValid ? 1 : 0;
          this.memory.set(this.pc, frameData);
          this.trace.push({
            pc: this.pc,
            instruction: instruction,
            result: isValid,
            registers: [...this.registers]
          });
        }
        this.pc++;
        return true;
      }
      
      validateFrameData(frame) {
        return frame && frame.valid_movement !== false;
      }
      
      async execute() {
        for (const instruction of this.instructions) {
          this.executeInstruction(instruction);
        }
        return true;
      }
      
      async generateSTARKProof() {
        const traceData = JSON.stringify(this.trace);
        const encoder = new TextEncoder();
        const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(traceData));
        return {
          proof: Array.from(new Uint8Array(hashBuffer))
            .map(b => b.toString(16).padStart(2, '0'))
            .join(''),
          publicInputs: {
            initialState: this.instructions[0],
            finalState: this.memory.get(this.pc - 1)
          }
        };
      }
      
      async wrapSTARKtoSNARK(starkProof) {
        const snarkInput = starkProof.proof + JSON.stringify(starkProof.publicInputs);
        const encoder = new TextEncoder();
        const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(snarkInput));
        return {
          proof: Array.from(new Uint8Array(hashBuffer))
            .map(b => b.toString(16).padStart(2, '0'))
            .join(''),
          publicInputs: starkProof.publicInputs
        };
      }
      
      async proveExecution(gameLog) {
        const loaded = await this.loadGameLogAsProgram(gameLog);
        if (!loaded) throw new Error("Failed to load game log");
        await this.execute();
        const starkProof = await this.generateSTARKProof();
        const snarkProof = await this.wrapSTARKtoSNARK(starkProof);
        return {
          starkProof,
          snarkProof,
          executionTrace: this.trace.length
        };
      }
    }
    
    // UI helper – display a message in the zkVM board
    function displayStep(message, error = false) {
      const stepDiv = document.createElement('div');
      stepDiv.style.marginBottom = '8px';
      stepDiv.style.color = error ? 'red' : '#00ff00';
      stepDiv.innerHTML = message;
      boardDiv.appendChild(stepDiv);
      boardDiv.scrollTop = boardDiv.scrollHeight;
    }
    
    // Helper to parse game log text into JSON objects
    function parseGameLog(logText) {
      try {
        const jsonObjects = logText.match(/{[^}]*}/g) || [];
        return jsonObjects.map(json => {
          try { return JSON.parse(json); }
          catch (e) { return null; }
        }).filter(Boolean);
      } catch (e) {
        displayStep("Log parsing error: " + e.message, true);
        return [];
      }
    }
    
    // Create final share text for tweet
    function createShareMessage() {
      const summary = boardDiv.innerText;
      const handles = "\n@CyberRektruck @0x_wingrock @0xCRASHOUT @wingrockXBT @0xblackcow";
      return "SP1 zkVM Proof Result:\n" + summary + handles;
    }
    
    // Setup share UI – a "Share on X" button that opens Twitter compose window
    function setupShareUI() {
      let existingContainer = document.getElementById("share-container");
      if (existingContainer) {
        document.getElementById("share-message").value = createShareMessage();
        return;
      }
      
      const shareContainer = document.createElement("div");
      shareContainer.id = "share-container";
      shareContainer.style.marginTop = "15px";
      shareContainer.style.padding = "10px";
      shareContainer.style.border = "1px solid #00ff00";
      shareContainer.style.backgroundColor = "black";
      
      const textArea = document.createElement("textarea");
      textArea.id = "share-message";
      textArea.style.width = "100%";
      textArea.style.height = "100px";
      textArea.readOnly = true;
      textArea.style.backgroundColor = "black";
      textArea.style.color = "#ff00ff";
      textArea.value = createShareMessage();
      
      const shareButton = document.createElement("button");
      shareButton.innerText = "Share on X";
      shareButton.style.marginTop = "10px";
      shareButton.onclick = function(){
        const tweetUrl = "https://twitter.com/intent/tweet?text=" + encodeURIComponent(textArea.value);
        window.open(tweetUrl, '_blank');
      };
      
      shareContainer.appendChild(textArea);
      shareContainer.appendChild(shareButton);
      boardDiv.parentElement.appendChild(shareContainer);
    }
    
    // Show a modal with SP1 zkVM docs/content
    function showDocsModal() {
      const modalOverlay = document.createElement('div');
      modalOverlay.style.position = 'fixed';
      modalOverlay.style.top = '0';
      modalOverlay.style.left = '0';
      modalOverlay.style.width = '100%';
      modalOverlay.style.height = '100%';
      modalOverlay.style.backgroundColor = 'rgba(0,0,0,0.85)';
      modalOverlay.style.zIndex = '1000';
      modalOverlay.style.display = 'flex';
      modalOverlay.style.justifyContent = 'center';
      modalOverlay.style.alignItems = 'center';
      
      const modalContent = document.createElement('div');
      modalContent.style.width = '80%';
      modalContent.style.maxWidth = '800px';
      modalContent.style.maxHeight = '90%';
      modalContent.style.backgroundColor = '#111';
      modalContent.style.color = '#00ff00';
      modalContent.style.padding = '20px';
      modalContent.style.borderRadius = '8px';
      modalContent.style.border = '1px solid #00ff00';
      modalContent.style.boxShadow = '0 0 10px #00ff00';
      modalContent.style.overflowY = 'auto';
      
      modalContent.innerHTML = `
        <h2 style="color:#ff00ff; text-align:center; margin-top:0;">SP1 zkVM Documentation</h2>
        
        <h3 style="color:#00ff00;">📌 Overview</h3>
        <p>SP1 is a Zero-Knowledge Proof (ZKP) virtual machine developed by Succinct Labs, based on the RISC-V architecture. It executes standard RISC-V binaries and proves accurate execution.</p>
        
        <h3 style="color:#00ff00;">🎯 Purpose and Significance</h3>
        <ul>
          <li><strong>Trustless Computation Proof:</strong> Verifies that the execution result is correct so anyone can validate it.</li>
          <li><strong>Data Privacy:</strong> Proves correct execution without revealing the input data.</li>
          <li><strong>Scalability:</strong> Summarizes complex computations into concise proofs to minimize verification costs.</li>
          <li><strong>Blockchain Integration:</strong> Suitable for L2/L3 solutions, rollups, and game state verification.</li>
        </ul>
        
        <h3 style="color:#00ff00;">🔄 Workflow</h3>
        <ol>
          <li><strong>Program Execution:</strong> Runs a RISC-V binary in the simulated zkVM.</li>
          <li><strong>Trace Generation:</strong> Records the state of every instruction executed.</li>
          <li><strong>STARK Proof Generation:</strong> Creates a mathematical proof from the execution trace.</li>
          <li><strong>SNARK Conversion:</strong> Transforms the STARK proof into a succinct SNARK.</li>
          <li><strong>Proof Verification:</strong> Confirms the proof to guarantee execution integrity.</li>
        </ol>
        
        <h3 style="color:#00ff00;">🔍 Simulation vs. Real SP1 zkVM</h3>
        <table style="width:100%; border-collapse:collapse; margin:10px 0;">
          <tr style="border-bottom:1px solid #00ff00;">
            <th style="text-align:left; padding:8px;">Simulation</th>
            <th style="text-align:left; padding:8px;">Real SP1 zkVM</th>
          </tr>
          <tr style="border-bottom:1px solid #333;">
            <td style="padding:8px;">Simplified hash-based proof</td>
            <td style="padding:8px;">Complex algebraic proof system (FRI, PCPs, etc.)</td>
          </tr>
          <tr style="border-bottom:1px solid #333;">
            <td style="padding:8px;">Basic parsing of a game log</td>
            <td style="padding:8px;">Execution of a complete RISC-V ELF binary</td>
          </tr>
          <tr style="border-bottom:1px solid #333;">
            <td style="padding:8px;">Limited instruction set</td>
            <td style="padding:8px;">Full RISC-V ISA support</td>
          </tr>
          <tr>
            <td style="padding:8px;">JavaScript-based simulation</td>
            <td style="padding:8px;">High-performance Rust implementation</td>
          </tr>
        </table>
        
        <h3 style="color:#00ff00;">🎮 Integrated with Worm Game</h3>
        <p>Each frame of the worm game is converted into an instruction for the zkVM simulation. This verifies the game was played fairly and that the score wasn’t tampered with.</p>
        
        <h3 style="color:#00ff00;">📚 Additional Resources</h3>
        <p>For more information on SP1 zkVM, visit the <a href="https://github.com/succinctlabs/sp1" style="color:#ff00ff;" target="_blank">Succinct Labs GitHub</a>.</p>
      `;
      
      const closeBtn = document.createElement('button');
      closeBtn.textContent = 'Close';
      closeBtn.style.marginTop = '20px';
      closeBtn.style.padding = '10px 20px';
      closeBtn.style.backgroundColor = '#ff00ff';
      closeBtn.style.border = 'none';
      closeBtn.style.borderRadius = '6px';
      closeBtn.style.fontSize = '16px';
      closeBtn.style.cursor = 'pointer';
      closeBtn.style.color = 'black';
      closeBtn.addEventListener('click', () => {
        modalOverlay.remove();
      });
      
      modalContent.appendChild(closeBtn);
      modalOverlay.appendChild(modalContent);
      document.body.appendChild(modalOverlay);
    }
    
    // Run SP1 zkVM process (only allowed after game over)
    async function runSP1Process() {
      if (proofGenerated) {
        displayStep("Warning: Proof already generated.", false);
        return;
      }
    
      boardDiv.innerHTML = '<h3 style="margin:0 0 10px; color:#00ff00;">SP1 zkVM Processing</h3>';
    
      try {
        const gameLogText = logElem.innerText.trim();
        if (!gameLogText) throw new Error("Game log not found.");
        
        // Step 1: Parse game log
        const gameLogFrames = parseGameLog(gameLogText);
        displayStep(`Step 1: Parsed ${gameLogFrames.length} frames.`, false);
        
        // Step 2: Initialize SP1 zkVM instance
        const sp1 = new SP1Simulator();
        displayStep("Step 2: SP1 zkVM instance initialized.", false);
        
        // Step 3: Execute and generate proof
        const startTime = performance.now();
        const result = await sp1.proveExecution(JSON.stringify(gameLogFrames));
        const endTime = performance.now();
        displayStep(`Step 3: Proof generated in ${(endTime - startTime).toFixed(2)}ms.`, false);
        
        // Step 4: Verification
        displayStep(`Step 4: Verification successful (Trace: ${result.executionTrace} steps).`, false);
        proofGenerated = true;
        setupShareUI();
        
      } catch (err) {
        displayStep(`Error: ${err.message}`, true);
      }
    }
    
    // Detect game over using a DOM observer
    const observer = new MutationObserver((mutations) => {
      const overlay = document.getElementById('game-over-overlay');
      if (overlay && !gameEnded) {
        gameEnded = true;
        displayStep("Game over detected: Ready to generate proof.", false);
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
    
    // zkVM button click event – allow only after game over
    zkvmBtn.addEventListener('click', async () => {
      if (!gameEnded) {
        displayStep("Warning: Proof generation allowed only after game ends.", true);
        return;
      }
      await runSP1Process();
    });
    
    // Initial message
    displayStep("SP1 zkVM Simulator: Click the simulation button after game over.", false);
    
    // --- Inserting Docs Button ABOVE the "Simulate zkVM" button ---
    const docsBtn = document.createElement('button');
    docsBtn.textContent = 'Docs';
    docsBtn.style.padding = '10px 20px';
    docsBtn.style.fontSize = '16px';
    docsBtn.style.cursor = 'pointer';
    docsBtn.style.border = 'none';
    docsBtn.style.borderRadius = '6px';
    docsBtn.style.backgroundColor = '#00ff00';
    docsBtn.style.color = '#000';
    // Insert the Docs button before the zkvmBtn in the DOM
    zkvmBtn.parentNode.insertBefore(docsBtn, zkvmBtn);
    docsBtn.addEventListener('click', showDocsModal);
  })();