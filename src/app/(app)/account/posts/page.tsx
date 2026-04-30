import { requireSession } from "@/lib/permissions";
import { listMyPosts } from "@/server/posts";
import { PostsSection } from "@/components/account/posts-section";

export default async function AccountPostsPage() {
  const session = await requireSession();
  const myPosts = await listMyPosts(session.user.id);

  return <PostsSection myPosts={myPosts} />;
}
