import Image from "next/image";

interface CommentItemProps {
  comment: {
    id: string;
    content: string;
    createdAt: Date;
    author: {
      id: string;
      name: string;
      avatar: string | null;
    };
    _count: {
      replies: number;
    };
  };
  locale: string;
  storyId: string;
}

export function CommentItem({ comment, locale }: CommentItemProps) {
  return (
    <div className="flex gap-4">
      {comment.author.avatar ? (
        <Image
          src={comment.author.avatar}
          alt={comment.author.name}
          width={40}
          height={40}
          className="w-10 h-10 rounded-full flex-shrink-0"
        />
      ) : (
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold flex-shrink-0">
          {comment.author.name.charAt(0)}
        </div>
      )}
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-medium text-gray-900">{comment.author.name}</span>
          <span className="text-sm text-gray-500">
            {new Date(comment.createdAt).toLocaleDateString("zh-CN")}
          </span>
        </div>
        <p className="text-gray-700 whitespace-pre-wrap">{comment.content}</p>
        {comment._count.replies > 0 && (
          <button className="mt-2 text-sm text-blue-600 hover:underline">
            查看 {comment._count.replies} 条回复
          </button>
        )}
      </div>
    </div>
  );
}
