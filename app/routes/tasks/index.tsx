import { useState, useEffect } from "react";
import { Link } from "react-router";
import { Plus, GripVertical, CheckCircle2, Clock, PlayCircle } from "lucide-react";

type Task = {
	id: string;
	title: string;
	description: string | null;
	status: string;
	assignee: string | null;
	created_at: string;
};

export default function TasksIndex() {
	const [tasks, setTasks] = useState<Task[]>([]);
	const [newTaskTitle, setNewTaskTitle] = useState("");
	const [isAdding, setIsAdding] = useState<string | null>(null);

	useEffect(() => {
		fetch("/api/tasks")
			.then((res) => res.json())
			.then((data: any) => {
				if (data.success) {
					setTasks(data.result);
				}
			});
	}, []);

	const columns = [
		{ id: "backlog", title: "Backlog", icon: <Clock size={16} className="text-gray-500" /> },
		{ id: "in-progress", title: "In Progress", icon: <PlayCircle size={16} className="text-blue-500" /> },
		{ id: "review", title: "Review", icon: <Clock size={16} className="text-purple-500" /> },
		{ id: "done", title: "Done", icon: <CheckCircle2 size={16} className="text-green-500" /> },
	];

	const handleAddTask = async (status: string) => {
		if (!newTaskTitle.trim()) {
			setIsAdding(null);
			return;
		}

		const res = await fetch("/api/tasks", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				title: newTaskTitle,
				status: status,
			}),
		});
		const data: any = await res.json();

		if (data.success) {
			setTasks([
				{
					id: data.result.id,
					title: data.result.title,
					description: null,
					status: status,
					assignee: null,
					created_at: new Date().toISOString(),
				},
				...tasks,
			]);
		}

		setNewTaskTitle("");
		setIsAdding(null);
	};

	return (
		<main className="min-h-screen bg-[#f7f7f5] text-[#171717]">
			<header className="border-b border-black/10 bg-white/50 px-8 py-4 flex items-center justify-between">
				<div className="flex items-center gap-4">
					<Link to="/" className="flex items-center gap-2 text-black/60 hover:text-black">
						<span className="grid h-6 w-6 place-items-center rounded bg-[#171717] text-white text-xs">J</span>
						<span className="font-semibold text-sm">Headquarters</span>
					</Link>
					<div className="h-4 w-px bg-black/10" />
					<h1 className="font-semibold">Global Task Board</h1>
				</div>
				<div className="text-xs text-black/40">Reference Prototype</div>
			</header>

			<div className="p-8 h-[calc(100vh-65px)] overflow-x-auto">
				<div className="flex gap-6 h-full min-w-max pb-8">
					{columns.map((column) => (
						<div key={column.id} className="w-[320px] flex flex-col h-full">
							<div className="flex items-center justify-between mb-4 px-2">
								<div className="flex items-center gap-2">
									{column.icon}
									<h2 className="font-medium text-sm">{column.title}</h2>
									<span className="bg-black/5 text-xs px-2 py-0.5 rounded-full text-black/60 font-medium">
										{tasks.filter((t) => t.status === column.id).length}
									</span>
								</div>
								<button
									onClick={() => setIsAdding(column.id)}
									className="text-black/40 hover:text-black transition p-1 rounded hover:bg-black/5"
								>
									<Plus size={16} />
								</button>
							</div>

							<div className="flex-1 bg-black/[0.02] rounded-xl p-3 border border-black/5 flex flex-col gap-3 overflow-y-auto">
								{isAdding === column.id && (
									<div className="bg-white rounded-lg p-3 shadow-sm border border-black/10">
										<textarea
											autoFocus
											value={newTaskTitle}
											onChange={(e) => setNewTaskTitle(e.target.value)}
											onKeyDown={(e) => {
												if (e.key === "Enter" && !e.shiftKey) {
													e.preventDefault();
													handleAddTask(column.id);
												} else if (e.key === "Escape") {
													setIsAdding(null);
													setNewTaskTitle("");
												}
											}}
											onBlur={() => handleAddTask(column.id)}
											placeholder="What needs to be done?"
											className="w-full text-sm outline-none resize-none placeholder:text-black/30"
											rows={2}
										/>
									</div>
								)}

								{tasks
									.filter((task) => task.status === column.id)
									.map((task) => (
										<div
											key={task.id}
											className="group bg-white rounded-lg p-3 shadow-sm border border-black/10 cursor-pointer hover:border-black/30 transition flex flex-col gap-2"
										>
											<div className="flex items-start gap-2">
												<div className="mt-0.5 cursor-grab text-black/20 group-hover:text-black/40 opacity-0 group-hover:opacity-100 transition">
													<GripVertical size={16} />
												</div>
												<p className="text-sm font-medium flex-1">{task.title}</p>
											</div>

											{(task.description || task.assignee) && (
												<div className="flex items-center gap-2 mt-2 pt-2 border-t border-black/5">
													{task.assignee && (
														<div className="flex items-center gap-1.5">
															<div className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-[10px] font-bold">
																{task.assignee.charAt(0).toUpperCase()}
															</div>
															<span className="text-xs text-black/60">{task.assignee}</span>
														</div>
													)}
												</div>
											)}
										</div>
									))}
							</div>
						</div>
					))}
				</div>
			</div>
		</main>
	);
}
