type PostTextProps = {
  text: string;
};

export function PostText({ text }: PostTextProps) {
  return <p className="whitespace-pre-wrap break-words text-zinc-800 dark:text-zinc-100">{text}</p>;
}
