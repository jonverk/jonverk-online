import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router";
import { nanoid } from "nanoid";
import { Hash, Plus, MessageSquare } from "lucide-react";

export default function Channels() {
	const navigate = useNavigate();
	const [channels, setChannels] = useState<{ id: string; name: string; description: string }[]>([
		{ id: "general", name: "general", description: "Company-wide announcements and chatter" },
		{ id: "engineering", name: "engineering", description: "Technical discussions and code reviews" },
		{ id: "random", name: "random", description: "Non-work banter and water cooler talk" },
	]);
	const [newChannelName, setNewChannelName] = useState("");

	const createChannel = (e: React.FormEvent) => {
		e.preventDefault();
		const name = newChannelName.trim().toLowerCase().replace(/\s+/g, '-');
		if (!name) return;

		const id = nanoid(10);
		setChannels([...channels, { id, name, description: "New channel" }]);
		setNewChannelName("");
		navigate(`/channels/${id}`);
	};

	return (
		<main className="min-h-screen bg-[#f7f7f5] text-[#171717] flex">
			{/* Sidebar */}
			<div className="w-64 border-r border-black/10 bg-white/50 p-4 flex flex-col h-screen overflow-y-auto">
				<Link to="/" className="flex items-center gap-2 mb-8 text-black/60 hover:text-black">
					<span className="grid h-6 w-6 place-items-center rounded bg-[#171717] text-white text-xs">J</span>
					<span className="font-semibold text-sm">Headquarters</span>
				</Link>

				<div className="flex items-center justify-between mb-4">
					<h2 className="text-xs font-semibold uppercase tracking-wider text-black/40">Channels</h2>
				</div>

				<div className="flex flex-col gap-1 flex-1">
					{channels.map((channel) => (
						<Link
							key={channel.id}
							to={`/channels/${channel.id}`}
							className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-black/5"
						>
							<Hash size={16} className="text-black/40" />
							{channel.name}
						</Link>
					))}
				</div>

				<form onSubmit={createChannel} className="mt-4 pt-4 border-t border-black/10 flex items-center gap-2">
					<Hash size={16} className="text-black/40" />
					<input
						type="text"
						value={newChannelName}
						onChange={(e) => setNewChannelName(e.target.value)}
						placeholder="Add channel"
						className="bg-transparent text-sm outline-none flex-1"
					/>
					<button type="submit" disabled={!newChannelName.trim()} className="text-black/40 hover:text-black disabled:opacity-50">
						<Plus size={16} />
					</button>
				</form>
			</div>

			{/* Main Content */}
			<div className="flex-1 flex flex-col items-center justify-center text-center p-8">
				<div className="bg-white p-8 rounded-2xl border border-black/10 shadow-sm max-w-md w-full">
					<div className="flex justify-center mb-4 text-blue-500">
						<MessageSquare size={48} />
					</div>
					<h1 className="text-2xl font-semibold mb-2">Welcome to Communications</h1>
					<p className="text-black/60 mb-6">Select a channel from the sidebar to view chat logs and agent handoffs, or create a new one.</p>
				</div>
			</div>
		</main>
	);
}
