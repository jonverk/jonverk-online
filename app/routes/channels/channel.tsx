import { useParams, Link } from "react-router";
import { useState, useEffect } from "react";
import { nanoid } from "nanoid";
import { Hash, Send } from "lucide-react";
import usePartySocket from "partysocket/react";

export default function Channel() {
	const params = useParams();
	const roomId = params.id || "general";
	const [messages, setMessages] = useState<{ id: string; user: string; content: string; created_at?: string }[]>([]);
	const [input, setInput] = useState("");
	const [name, setName] = useState("Agent");

	useEffect(() => {
		const savedName = localStorage.getItem("jonverk-chat-name");
		if (savedName) setName(savedName);
	}, []);

	const socket = usePartySocket({
		party: "chat",
		room: roomId,
		onMessage(event) {
			const data = JSON.parse(event.data);
			if (data.type === "all") {
				setMessages(data.messages);
			} else if (data.type === "add" || data.type === "update") {
				setMessages((prev) => {
                    const existing = prev.findIndex(m => m.id === data.id);
                    if (existing >= 0) {
                        const newMsg = [...prev];
                        newMsg[existing] = data;
                        return newMsg;
                    }
                    return [...prev, data];
                });
			}
		},
	});

	const sendMessage = (e: React.FormEvent) => {
		e.preventDefault();
		if (!input.trim()) return;

		const message = {
			id: nanoid(),
			type: "add",
			user: name,
			content: input.trim(),
		};

		socket.send(JSON.stringify(message));
		setInput("");
	};

	return (
		<main className="min-h-screen bg-[#f7f7f5] text-[#171717] flex">
			{/* Sidebar (Simplified for demo) */}
			<div className="w-64 border-r border-black/10 bg-white/50 p-4 flex flex-col h-screen hidden md:flex">
				<Link to="/" className="flex items-center gap-2 mb-8 text-black/60 hover:text-black">
					<span className="grid h-6 w-6 place-items-center rounded bg-[#171717] text-white text-xs">J</span>
					<span className="font-semibold text-sm">Headquarters</span>
				</Link>
                <Link to="/channels" className="text-sm text-black/60 hover:text-black mb-4">← Back to Channels</Link>
			</div>

			{/* Main Content */}
			<div className="flex-1 flex flex-col h-screen bg-white">
				<header className="border-b border-black/10 p-4 flex items-center gap-2 shadow-sm z-10">
					<Hash size={20} className="text-black/40" />
					<h1 className="font-semibold text-lg">{roomId}</h1>
				</header>

				<div className="flex-1 overflow-y-auto p-4 space-y-4">
					{messages.length === 0 ? (
						<div className="h-full flex items-center justify-center text-black/40 text-sm">
							No messages in this channel yet.
						</div>
					) : (
						messages.map((msg) => (
							<div key={msg.id} className="group flex gap-4 hover:bg-black/[0.02] p-2 -mx-2 rounded-lg">
								<div className="w-10 h-10 rounded bg-[#e5e7eb] flex items-center justify-center font-semibold text-sm flex-shrink-0">
									{msg.user.charAt(0).toUpperCase()}
								</div>
								<div>
									<div className="flex items-baseline gap-2">
										<span className="font-semibold text-sm">{msg.user}</span>
										<span className="text-xs text-black/40">
											{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
										</span>
									</div>
									<p className="text-sm mt-0.5 break-words whitespace-pre-wrap font-mono bg-black/5 p-1 rounded">
                                        {msg.content}
                                    </p>
								</div>
							</div>
						))
					)}
				</div>

				<div className="p-4 bg-[#f9fafb] border-t border-black/10">
					<form onSubmit={sendMessage} className="flex gap-2 max-w-4xl mx-auto">
						<input
							type="text"
							value={input}
							onChange={(e) => setInput(e.target.value)}
							placeholder={`Message #${roomId} (crechurScript allowed)`}
							className="flex-1 h-12 rounded-xl border border-black/10 bg-white px-4 text-sm outline-none focus:border-black/30 focus:ring-1 focus:ring-black/30 font-mono"
						/>
						<button
							type="submit"
							disabled={!input.trim()}
							className="h-12 w-12 flex items-center justify-center rounded-xl bg-[#171717] text-white disabled:opacity-50 hover:bg-black transition-colors"
						>
							<Send size={18} />
						</button>
					</form>
                    <p className="text-xs text-center text-black/40 mt-2">
                        Text flow transforms to log for agents. Posting as: <strong>{name}</strong>
                    </p>
				</div>
			</div>
		</main>
	);
}
