"use client";

import { DndContext, KeyboardSensor, PointerSensor, useDraggable, useDroppable, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { ChevronDown, GripVertical, MoreHorizontal } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { deleteApplication, moveApplication } from "@/app/actions/applications";
import { StatusBadge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { EmptyState } from "@/components/ui/states";
import { ageLabel, nextAction, type TrackerCard } from "@/lib/applications";
import { APPLICATION_STATUSES, STATUS_LABEL, type ApplicationStatus } from "@/lib/constants";
import { cn } from "@/lib/utils";

function useMove(setCards: React.Dispatch<React.SetStateAction<TrackerCard[]>>) {
  const router = useRouter();
  const [, start] = useTransition();
  return (card: TrackerCard, status: ApplicationStatus) => {
    if (card.status === status) return;
    const previous = card.status;
    setCards((cs) => cs.map((c) => (c.id === card.id ? { ...c, status } : c)));
    start(async () => {
      const res = await moveApplication(card.id, status);
      if ("error" in res && res.error) {
        setCards((cs) => cs.map((c) => (c.id === card.id ? { ...c, status: previous } : c)));
        toast.error(res.error);
        return;
      }
      if (status === "INTERVIEW") {
        toast.success("Moved to Interview. Your prep page is ready.", {
          action: { label: "Open prep", onClick: () => router.push(`/applications/${card.id}/prep`) },
        });
      } else toast(`Moved to ${STATUS_LABEL[status]}`);
      router.refresh();
    });
  };
}

function MoveMenu({ card, onMove, onDelete }: { card: TrackerCard; onMove: (s: ApplicationStatus) => void; onDelete: () => void }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="inline-flex size-11 items-center justify-center rounded-[6px] text-muted hover:bg-border/50 hover:text-foreground md:size-8">
        <MoreHorizontal className="size-4" aria-hidden />
        <span className="sr-only">Move {card.title} to</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Move to</DropdownMenuLabel>
        {APPLICATION_STATUSES.filter((s) => s !== card.status).map((s) => (
          <DropdownMenuItem key={s} onSelect={() => onMove(s)}>
            {STATUS_LABEL[s]}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        {card.hasPrep || card.status === "INTERVIEW" ? (
          <DropdownMenuItem asChild>
            <Link href={`/applications/${card.id}/prep`}>Interview prep</Link>
          </DropdownMenuItem>
        ) : null}
        <DropdownMenuItem onSelect={onDelete} className="text-danger">
          Remove from tracker
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function CardBody({ card }: { card: TrackerCard }) {
  const action = nextAction(card);
  return (
    <div className="min-w-0 flex-1">
      <Link href={`/jobs/${card.jobId}`} className="block font-semibold hover:underline">
        {card.title}
      </Link>
      <p className="text-small text-muted">{card.company}</p>
      <p className="text-small text-muted">{ageLabel(card)}</p>
      {action ? <p className={cn("text-small", action === "Follow up today" ? "font-medium text-foreground" : "text-muted")}>{action}</p> : null}
      {card.status === "INTERVIEW" ? (
        <Link href={`/applications/${card.id}/prep`} className="mt-1 inline-flex min-h-11 items-center text-small text-accent hover:underline md:min-h-0">
          Open interview prep
        </Link>
      ) : null}
    </div>
  );
}

function DraggableCard({ card, onMove, onDelete }: { card: TrackerCard; onMove: (s: ApplicationStatus) => void; onDelete: () => void }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: card.id });
  return (
    <li
      ref={setNodeRef}
      style={transform ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` } : undefined}
      className={cn("flex gap-1 rounded-[8px] border border-border bg-surface p-3", isDragging && "z-10 shadow-lg")}
    >
      <button
        type="button"
        className="-ml-1 inline-flex w-6 shrink-0 cursor-grab items-start justify-center pt-0.5 text-muted"
        aria-label={`Drag ${card.title}. Or use the Move to menu.`}
        {...attributes}
        {...listeners}
      >
        <GripVertical className="size-4" aria-hidden />
      </button>
      <CardBody card={card} />
      <MoveMenu card={card} onMove={onMove} onDelete={onDelete} />
    </li>
  );
}

function Column({ status, cards, children }: { status: ApplicationStatus; cards: TrackerCard[]; children: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id: status });
  return (
    <section ref={setNodeRef} aria-label={STATUS_LABEL[status]} className={cn("flex min-w-0 flex-col rounded-[8px] bg-border/30 p-2", isOver && "bg-accent-soft/50")}>
      <h2 className="mb-2 flex items-center justify-between px-1">
        <StatusBadge status={status} />
        <span className="tabular text-small text-muted">{cards.length}</span>
      </h2>
      {children}
    </section>
  );
}

export function Tracker({ initial }: { initial: TrackerCard[] }) {
  const [cards, setCards] = useState(initial);
  const [rejectedOpen, setRejectedOpen] = useState(false);
  const move = useMove(setCards);
  const router = useRouter();
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }), useSensor(KeyboardSensor));

  const remove = (card: TrackerCard) => {
    setCards((cs) => cs.filter((c) => c.id !== card.id));
    deleteApplication(card.id).then(() => {
      toast("Removed from tracker");
      router.refresh();
    });
  };

  function onDragEnd(e: DragEndEvent) {
    const card = cards.find((c) => c.id === e.active.id);
    const target = e.over?.id as ApplicationStatus | undefined;
    if (card && target) move(card, target);
  }

  if (cards.length === 0) {
    return (
      <EmptyState
        message="Nothing tracked yet. Save or apply to a job and it shows up here."
        action={
          <Link href="/jobs" className="font-medium text-accent hover:underline">
            Find jobs
          </Link>
        }
      />
    );
  }

  const byStatus = (s: ApplicationStatus) => cards.filter((c) => c.status === s);

  return (
    <>
      {/* Desktop: board */}
      <DndContext sensors={sensors} onDragEnd={onDragEnd}>
        <div className="hidden gap-3 lg:grid lg:grid-cols-5">
          {APPLICATION_STATUSES.map((s) => {
            const list = byStatus(s);
            const collapsed = s === "REJECTED" && !rejectedOpen;
            return (
              <Column key={s} status={s} cards={list}>
                {collapsed ? (
                  <button type="button" className="min-h-9 rounded-[6px] px-2 text-left text-small text-muted hover:bg-border/50" onClick={() => setRejectedOpen(true)}>
                    Show {list.length} rejected
                  </button>
                ) : (
                  <ul className="flex flex-col gap-2">
                    {list.map((c) => (
                      <DraggableCard key={c.id} card={c} onMove={(st) => move(c, st)} onDelete={() => remove(c)} />
                    ))}
                  </ul>
                )}
              </Column>
            );
          })}
        </div>
      </DndContext>

      {/* Mobile and tablet: grouped list */}
      <div className="flex flex-col gap-3 lg:hidden">
        {APPLICATION_STATUSES.map((s) => {
          const list = byStatus(s);
          return (
            <details key={s} open={s !== "REJECTED"} className="group rounded-[8px] border border-border bg-surface">
              <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between px-4">
                <span className="flex items-center gap-2">
                  <StatusBadge status={s} />
                  <span className="tabular text-small text-muted">{list.length}</span>
                </span>
                <ChevronDown className="size-4 text-muted transition-transform group-open:rotate-180" aria-hidden />
              </summary>
              {list.length ? (
                <ul className="flex flex-col border-t border-border">
                  {list.map((c) => (
                    <li key={c.id} className="flex gap-2 border-b border-border px-4 py-3 last:border-0">
                      <CardBody card={c} />
                      <MoveMenu card={c} onMove={(st) => move(c, st)} onDelete={() => remove(c)} />
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="border-t border-border px-4 py-3 text-small text-muted">Nothing here.</p>
              )}
            </details>
          );
        })}
      </div>
    </>
  );
}
