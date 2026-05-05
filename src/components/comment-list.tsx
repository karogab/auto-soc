import { CommentCard, type CommentCardModel } from "@/components/comment-card";
import { CommentForm } from "@/components/comment-form";
import type { CommentForFeed } from "@/server/comments";

type CommentListProps = {
  postId: string;
  postAuthorUsername: string;
  comments: CommentForFeed[];
  myReactions: Map<string, "like" | "dislike">;
  canPin: boolean;
};

function toCardModel(c: CommentForFeed, postAuthorUsername: string): CommentCardModel {
  const targetUsername = c.parent?.author.username ?? postAuthorUsername;
  return {
    id: c.id,
    postId: c.postId,
    text: c.text,
    pinnedOnPost: c.pinnedOnPost,
    createdAt: c.createdAt,
    author: {
      firstName: c.author.firstName,
      lastName: c.author.lastName,
      username: c.author.username,
      isVerified: c.author.isVerified,
    },
    targetUsername,
    likeCount: c.likeCount,
    dislikeCount: c.dislikeCount,
  };
}

export function CommentList({
  postId,
  postAuthorUsername,
  comments,
  myReactions,
  canPin,
}: CommentListProps) {
  return (
    <div className="space-y-3">
      <CommentForm postId={postId} placeholder="Write a comment..." submitLabel="Comment" />
      {comments.length === 0 ? null : (
        <ul className="space-y-3">
          {comments.map((c) => (
            <li key={c.id}>
              <CommentCard
                comment={toCardModel(c, postAuthorUsername)}
                myReaction={myReactions.get(c.id) ?? null}
                canPin={canPin}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
