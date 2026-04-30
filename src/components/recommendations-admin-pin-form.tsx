import { setRecommendationsPinAction } from "@/actions/posts";

type RecommendationsAdminPinFormProps = {
  postId: string;
  isPinned: boolean;
};

export function RecommendationsAdminPinForm({ postId, isPinned }: RecommendationsAdminPinFormProps) {
  return (
    <form action={setRecommendationsPinAction} className="inline">
      <input type="hidden" name="postId" value={postId} />
      <input type="hidden" name="pinned" value={isPinned ? "0" : "1"} />
      <button
        type="submit"
        className="text-sm font-medium text-violet-700 underline decoration-violet-400/60 hover:text-violet-900 dark:text-violet-400 dark:hover:text-violet-300"
      >
        {isPinned ? "Unpin" : "Pin"}
      </button>
    </form>
  );
}
