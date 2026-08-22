import WebSocket from "ws";
import crypto from "crypto";
import readline from "readline";

const rl = readline.createInterface({
	input: process.stdin,
	output: process.stdout,
});

const API_PORT = process.env.PORT || 8787;
const WS_URL = `ws://localhost:${API_PORT}/parties/chat/general`;

const args = process.argv.slice(2);
const defaultName = args[0] || "CLI Agent";

const ws = new WebSocket(WS_URL);

ws.on("open", () => {
	console.log(`[CLI] Connected to ${WS_URL} as ${defaultName}`);

	const askForMessage = () => {
		rl.question(`[${defaultName}] > `, (message) => {
			if (message.toLowerCase() === "exit") {
				ws.close();
				rl.close();
				return;
			}

            // Simple validation rule per the spec "no \" or ; inside text"
			const cleanMessage = message.replace(/[";]/g, "");

            // Format to crechurScript
            // <talk id from to type wait text>
            const talkId = crypto.randomUUID().slice(0, 8);
            const from = defaultName.replace(/\s+/g, '_');
            const crechurScript = `[<AGENT_TALK <${talkId} ${from} system report 0 ${cleanMessage}>; AGENT_TALK_END>]`;

			const payload = {
				id: crypto.randomUUID(),
				type: "add",
				user: defaultName,
				content: crechurScript,
			};

			ws.send(JSON.stringify(payload));
			askForMessage();
		});
	};

    // Start listening
	askForMessage();
});

ws.on("message", (data) => {
	const message = JSON.parse(data.toString());

    if (message.type === 'all') {
        // console.log("[CLI] Received chat history.");
    } else if (message.type === 'add' || message.type === 'update') {
		if (message.user !== defaultName) {
            readline.clearLine(process.stdout, 0);
            readline.cursorTo(process.stdout, 0);
			console.log(`[${message.user}]: ${message.content}`);
			rl.prompt(true);
		}
	}
});

ws.on("close", () => {
	console.log("[CLI] Disconnected");
});

ws.on("error", (error) => {
	console.error("[CLI] WebSocket error:", error.message);
});
