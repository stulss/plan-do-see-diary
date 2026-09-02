"use client";

import { DragEvent, ReactNode, useState } from "react";
import { useRouter } from "next/navigation";

const TASK_MIME = "application/x-plan-do-see-task";

export function DraggableTask({ taskId, children }: { taskId: string; children: ReactNode }) {
  const [dragging, setDragging] = useState(false);
  return <div
    className={`planner-task-drag ${dragging ? "is-dragging" : ""}`}
    draggable
    onDragStart={(event) => {
      // 브라우저 기본 DnD를 써서 별도 라이브러리 없이 할 일 ID만 전달한다.
      event.dataTransfer.effectAllowed = "move";
      event.dataTransfer.setData(TASK_MIME, taskId);
      event.dataTransfer.setData("text/plain", taskId);
      setDragging(true);
    }}
    onDragEnd={() => setDragging(false)}
  >{children}</div>;
}

export function TaskDropZone({ date, className = "", children }: { date: string; className?: string; children: ReactNode }) {
  const router = useRouter();
  const [over, setOver] = useState(false);
  const [message, setMessage] = useState("");

  async function move(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setOver(false);
    const taskId = event.dataTransfer.getData(TASK_MIME) || event.dataTransfer.getData("text/plain");
    if (!/^\d+$/.test(taskId)) return;
    const response = await fetch(`/api/tasks/${taskId}/date`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ due_date: date })
    });
    setMessage(response.ok ? `${date}로 옮겼습니다.` : "날짜를 바꾸지 못했습니다.");
    if (response.ok) router.refresh();
  }

  return <div
    className={`planner-drop-zone ${className} ${over ? "is-drop-target" : ""}`.trim()}
    onDragEnter={() => setOver(true)}
    onDragLeave={(event) => {
      if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setOver(false);
    }}
    onDragOver={(event) => { event.preventDefault(); event.dataTransfer.dropEffect = "move"; }}
    onDrop={move}
  >{children}<span className="sr-only" aria-live="polite">{message}</span></div>;
}
