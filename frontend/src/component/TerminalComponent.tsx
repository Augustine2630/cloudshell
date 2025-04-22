import React, { useEffect, useRef, useState } from "react";
import { Terminal } from "xterm";
import { AttachAddon } from "xterm-addon-attach";
import { FitAddon } from "xterm-addon-fit";
import { WebLinksAddon } from "xterm-addon-web-links";
import { Unicode11Addon } from "xterm-addon-unicode11";
import { SerializeAddon } from "xterm-addon-serialize";
import 'xterm/css/xterm.css';

interface Props {
    ip: string;
}

const TerminalComponent: React.FC<Props> = ({ ip }) => {
    const terminalRef = useRef<HTMLDivElement | null>(null);
    const terminalInstance = useRef<Terminal | null>(null);
    const [isTerminalReady, setTerminalReady] = useState(false);

    useEffect(() => {
        if (terminalInstance.current) return;

        terminalInstance.current = new Terminal({
            cursorBlink: true,
            screenReaderMode: true,
            cols: 128,
            allowProposedApi: true,
        });

        if (terminalRef.current) {
            setTerminalReady(true);
        }

        return () => {
            if (terminalInstance.current) {
                terminalInstance.current.dispose();
                terminalInstance.current = null;
            }
        };
    }, []);

    useEffect(() => {
        if (isTerminalReady && terminalRef.current) {
            const term = terminalInstance.current;
            if (term && terminalRef.current) {
                term.open(terminalRef.current);

                const fitAddon = new FitAddon();
                const webLinksAddon = new WebLinksAddon();
                const unicode11Addon = new Unicode11Addon();
                const serializeAddon = new SerializeAddon();
                const ws = new WebSocket(`wss://${ip}/xterm.js`);
                const attachAddon = new AttachAddon(ws);

                term.loadAddon(fitAddon);
                term.loadAddon(webLinksAddon);
                term.loadAddon(unicode11Addon);
                term.loadAddon(serializeAddon);

                ws.onopen = () => {
                    term.loadAddon(attachAddon);
                    term.focus();
                    fitAddon.fit();
                };

                ws.onclose = () => {
                    term.write("\r\n\nConnection terminated (refresh to restart)\n");
                };

                window.addEventListener("resize", () => fitAddon.fit());
                fitAddon.fit();
            }
        }
    }, [isTerminalReady, ip]);

    return (
        <div
            ref={terminalRef}
            style={{ height: "100vh", width: "100vw", backgroundColor: "#000" }}
        />
    );
};

export default TerminalComponent;
