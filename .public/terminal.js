(function () {
  var terminal = new Terminal({
    screenKeys: true,
    useStyle: true,
    cursorBlink: true,
    fullscreenWin: true,
    maximizeWin: true,
    screenReaderMode: true,
    cols: 128,
  });

  terminal.open(document.getElementById("terminal"));

  function initializeWebSocket() {
    var protocol = location.protocol === "https:" ? "wss://" : "ws://";
    var url = protocol + location.host + "/xterm.js";
    var ws = new WebSocket(url);
    var attachAddon = new AttachAddon.AttachAddon(ws);
    var fitAddon = new FitAddon.FitAddon();
    terminal.loadAddon(fitAddon);
    var webLinksAddon = new WebLinksAddon.WebLinksAddon();
    terminal.loadAddon(webLinksAddon);
    var unicode11Addon = new Unicode11Addon.Unicode11Addon();
    terminal.loadAddon(unicode11Addon);
    var serializeAddon = new SerializeAddon.SerializeAddon();
    terminal.loadAddon(serializeAddon);

    ws.onclose = function (event) {
      console.log(event);
      terminal.write("\r\n\nConnection has been terminated from the server-side (hit refresh to restart)\n");
    };

    ws.onopen = function () {
      terminal.loadAddon(attachAddon);
      terminal._initialized = true;
      terminal.focus();
      setTimeout(function () {
        fitAddon.fit();
      });

      terminal.onResize(function (event) {
        var rows = event.rows;
        var cols = event.cols;
        var size = JSON.stringify({ cols: cols, rows: rows + 1 });
        var send = new TextEncoder().encode("\x01" + size);
        console.log("Resizing to", size);
        ws.send(send);
      });

      terminal.onTitleChange(function (event) {
        console.log(event);
      });

      window.onresize = function () {
        fitAddon.fit();
      };
    };
  }

  // Handle authentication success
  document.addEventListener("authSuccess", function () {
    console.log("Auth success, initializing WebSocket...");
    initializeWebSocket();
  });

  // Handle authentication failure (FIXED: Terminal is now initialized)
  document.addEventListener("authFailed", function () {
    console.log("Auth failed, displaying error in terminal.");
    terminal.write("\r\n\n\x1b[31mAuthentication failed. Access denied.\x1b[0m\n");
  });
})();
