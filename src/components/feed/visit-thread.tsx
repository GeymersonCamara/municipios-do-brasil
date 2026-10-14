"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useVisitComments, type VisitComment } from "@/hooks/useVisitComments";
import { formatRelativeTime } from "@/lib/format-time";
import { cn } from "@/lib/utils";

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function CommentBubble({
  comment,
  onReply,
}: {
  comment: VisitComment;
  onReply?: () => void;
}) {
  return (
    <div className="flex items-start gap-2">
      <div
        className={cn(
          "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold",
          comment.user.isYou
            ? "bg-visited/20 text-visited"
            : "bg-secondary text-secondary-foreground",
        )}
        aria-hidden
      >
        {initials(comment.user.name) || "?"}
      </div>
      <div className="min-w-0 flex-1">
        <div className="rounded-2xl bg-muted/70 px-3 py-2">
          <p className="text-xs font-semibold">{comment.user.name}</p>
          <p className="whitespace-pre-wrap text-sm">{comment.body}</p>
        </div>
        <div className="mt-1 flex items-center gap-3 px-2 text-xs text-muted-foreground">
          <span>{formatRelativeTime(comment.createdAt)}</span>
          {onReply ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 px-2"
              onClick={onReply}
            >
              Responder
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export function VisitThread({ visitId }: { visitId: string }) {
  const { comments, isLoading, isError, addComment, isPosting } =
    useVisitComments(visitId);
  const [draft, setDraft] = useState("");
  const [replyTo, setReplyTo] = useState<{ id: string; name: string } | null>(
    null,
  );

  async function submit() {
    const body = draft.trim();
    if (!body) return;
    await addComment(body, replyTo?.id);
    setDraft("");
    setReplyTo(null);
  }

  return (
    <div className="mt-3 space-y-3 border-t pt-3">
      {isLoading ? (
        <p className="text-sm text-muted-foreground">Carregando comentários…</p>
      ) : isError ? (
        <p className="text-sm text-destructive">
          Não foi possível carregar os comentários.
        </p>
      ) : comments.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Nenhuma pergunta ainda. Seja o primeiro a comentar.
        </p>
      ) : (
        <ul className="space-y-3">
          {comments.map((comment) => (
            <li key={comment.id} className="space-y-2">
              <CommentBubble
                comment={comment}
                onReply={() =>
                  setReplyTo({ id: comment.id, name: comment.user.name })
                }
              />
              {(comment.replies ?? []).length > 0 ? (
                <ul className="space-y-2 pl-9">
                  {comment.replies?.map((reply) => (
                    <li key={reply.id}>
                      <CommentBubble
                        comment={reply}
                        onReply={() =>
                          setReplyTo({
                            id: comment.id,
                            name: reply.user.name,
                          })
                        }
                      />
                    </li>
                  ))}
                </ul>
              ) : null}
            </li>
          ))}
        </ul>
      )}

      <form
        className="space-y-2"
        onSubmit={(event) => {
          event.preventDefault();
          void submit();
        }}
      >
        {replyTo ? (
          <p className="text-xs text-muted-foreground">
            Respondendo a{" "}
            <span className="font-medium text-foreground">{replyTo.name}</span>
            {" · "}
            <button
              type="button"
              className="font-medium text-foreground underline"
              onClick={() => setReplyTo(null)}
            >
              Cancelar
            </button>
          </p>
        ) : null}
        <div className="flex items-center gap-2">
          <input
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            maxLength={500}
            placeholder={
              replyTo
                ? `Resposta para ${replyTo.name}`
                : "Escreva um comentário…"
            }
            className="h-10 min-w-0 flex-1 rounded-full border border-input bg-muted/50 px-4 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
          <Button
            type="submit"
            size="sm"
            className="shrink-0 rounded-full"
            disabled={isPosting || !draft.trim()}
          >
            {replyTo ? "Responder" : "Comentar"}
          </Button>
        </div>
      </form>
    </div>
  );
}
