(function() {
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
  var protocol = (location.protocol === "https:") ? "wss://" : "ws://";
  var url = protocol + location.host + "/xterm.js"
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
  ws.onclose = function(event) {
    console.log(event);
    terminal.write('\r\n\nconnection has been terminated from the server-side (hit refresh to restart)\n')
  };
  ws.onopen = function() {
    terminal.loadAddon(attachAddon);
    terminal._initialized = true;
    terminal.focus();
    setTimeout(function() {fitAddon.fit()});
    terminal.onResize(function(event) {
      var rows = event.rows;
      var cols = event.cols;
      var size = JSON.stringify({cols: cols, rows: rows + 1});
      var send = new TextEncoder().encode("\x01" + size);
      console.log('resizing to', size);
      ws.send(send);
    });
    terminal.onTitleChange(function(event) {
      console.log(event);
    });
    window.onresize = function() {
      fitAddon.fit();
    };
  };

  function logTelegramUserData() {
    if (window.Telegram && window.Telegram.WebApp) {
      window.Telegram.WebApp.ready();
      var user = window.Telegram.WebApp.initDataUnsafe.user;

      if (user) {
        console.log("User Data:", user);
        terminal.write(
            `\r\n\nUser: ${user.first_name} ${user.last_name || ""} (@${user.username || "N/A"})\n`
        );
      } else {
        console.log("No user data available.");
        terminal.write("\r\n\nNo user data available.\n");
      }
    } else {
      console.log("Telegram Mini App not detected.");
      terminal.write("\r\n\nTelegram Mini App not detected.\n");
    }
  }

  // Execute user data logging on page load
  logTelegramUserData();
})();
