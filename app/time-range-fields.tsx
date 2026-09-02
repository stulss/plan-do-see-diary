"use client";

import { useState } from "react";
import { clockText, runDuration, taskSchedule } from "@/lib/domain/time";

function taskDuration(start: string, end: string) {
  if (!start || !end) return "시작과 마감 시각을 입력하면 자동 계산됩니다.";
  try { return `자동 계산: ${taskSchedule(start, end).minutes}분`; }
  catch (error) { return (error as Error).message; }
}

export function TaskTimeFields({ startMinute, endMinute }: { startMinute?: number | null; endMinute?: number | null }) {
  const [start, setStart] = useState(clockText(startMinute));
  const [end, setEnd] = useState(clockText(endMinute));
  return <>
    <label>시작 시각<input type="time" name="start_time" required value={start} onChange={(event) => setStart(event.target.value)} /></label>
    <label>마감 시각<input type="time" name="end_time" required value={end} onChange={(event) => setEnd(event.target.value)} /></label>
    <output className="auto-duration" aria-live="polite">{taskDuration(start, end)}</output>
  </>;
}

function actualDuration(start: string, end: string) {
  if (!start || !end) return "시작과 종료 시각을 입력하면 자동 계산됩니다.";
  try { return `자동 계산: ${runDuration(start, end).minutes}분`; }
  catch (error) { return (error as Error).message; }
}

export function RunTimeFields() {
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  return <>
    <label>시작 시각<input type="datetime-local" name="started_at" required value={start} onChange={(event) => setStart(event.target.value)} /></label>
    <label>종료 시각<input type="datetime-local" name="ended_at" required value={end} onChange={(event) => setEnd(event.target.value)} /></label>
    <output className="auto-duration" aria-live="polite">{actualDuration(start, end)}</output>
  </>;
}
