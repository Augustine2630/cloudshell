import React, { useEffect, useRef, useState } from "react";
import { Terminal } from "xterm";
import { AttachAddon } from "xterm-addon-attach";
import { FitAddon } from "xterm-addon-fit";
import { WebLinksAddon } from "xterm-addon-web-links";
import { Unicode11Addon } from "xterm-addon-unicode11";
import { SerializeAddon } from "xterm-addon-serialize";
import 'xterm/css/xterm.css';

const TerminalComponent: React.FC = () => {
    const terminalRef = useRef<HTMLDivElement | null>(null);
    const terminalInstance = useRef<Terminal | null>(null);
    const [isTerminalReady, setTerminalReady] = useState(false);  // Track if terminal is ready

    useEffect(() => {
        // Only initialize the terminal once
        if (terminalInstance.current) return;

        // Initialize the terminal instance
        const term = new Terminal({
            cursorBlink: true,
            screenReaderMode: true,
            cols: 128,
            allowProposedApi: true,
        });

        terminalInstance.current = term;

        // Wait until the ref (the div) is available before calling term.open()
        if (terminalRef.current) {
            setTerminalReady(true);  // Mark terminal as ready to open
        }

        return () => {
            // Clean up terminal instance when the component unmounts
            if (terminalInstance.current) {
                terminalInstance.current.dispose();
                terminalInstance.current = null;
            }
        };
    }, []);  // Empty dependency array ensures this runs only once

    useEffect(() => {
        // Open the terminal only once the ref is ready
        if (isTerminalReady && terminalRef.current) {
            const term = terminalInstance.current;
            if (term && terminalRef.current) {
                term.open(terminalRef.current);

                // Add the necessary add-ons after opening the terminal
                const fitAddon = new FitAddon();
                const webLinksAddon = new WebLinksAddon();
                const unicode11Addon = new Unicode11Addon();
                const serializeAddon = new SerializeAddon();
                const ws = new WebSocket('ws://localhost:8080/xterm.js');
                const attachAddon = new AttachAddon(ws);

                // Apply add-ons to the terminal
                term.loadAddon(fitAddon);
                term.loadAddon(webLinksAddon);
                term.loadAddon(unicode11Addon);
                term.loadAddon(serializeAddon);

                // WebSocket connection
                ws.onopen = () => {
                    term.loadAddon(attachAddon);
                    term.focus();
                    fitAddon.fit();  // Fit terminal size after the terminal is opened
                };

                ws.onclose = () => {
                    term.write("\r\n\nConnection terminated (refresh to restart)\n");
                };

                // Ensure terminal resizes properly when window is resized
                window.addEventListener("resize", () => fitAddon.fit());
                fitAddon.fit();  // Fit the terminal immediately after opening
            }
        }
    }, [isTerminalReady]);  // Trigger this effect when terminal is ready to be opened

    return (
        <div
            ref={terminalRef}
            style={{ height: "100%", width: "100%" }}
        />
    );
};

export default TerminalComponent;
