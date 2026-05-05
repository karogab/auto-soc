import { Pin, PinOff } from "lucide-react";
import { setCommentPinnedAction } from "@/actions/comments";

type CommentPinFormProps = {
  commentId: string;
  isPinned: boolean;
};

export function CommentPinForm({ commentId, isPinned }: CommentPinFormProps) {
  const Icon = isPinned ? PinOff : Pin;
  const label = isPinned ? "Unpin comment" : "Pin comment";

  return (
    <form action={setCommentPinnedAction} className="inline">
      <input type="hidden" name="commentId" value={commentId} />
      <input type="hidden" name="pinned" value={isPinned ? "0" : "1"} />
      <button
        type="submit"
        title={label}
        aria-label={label}
        className="inline-flex items-center text-violet-700 hover:text-violet-900 dark:text-violet-400 dark:hover:text-violet-300"
      >
        <Icon className="h-4 w-4" strokeWidth={2} aria-hidden />
      </button>
    </form>
  );
}
