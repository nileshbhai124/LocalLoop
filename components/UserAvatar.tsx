import { User } from "@/types";
import { cn } from "@/lib/utils";

interface UserAvatarProps {
  user: User;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export default function UserAvatar({ user, size = "md", className }: UserAvatarProps) {
  const sizes = {
    sm: "w-8 h-8 text-xs",
    md: "w-10 h-10 text-sm",
    lg: "w-16 h-16 text-lg",
  };

  const initials = user.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div
      className={cn(
        "rounded-full bg-primary text-white flex items-center justify-center font-semibold",
        sizes[size],
        className
      )}
      aria-label={`${user.name}'s avatar`}
    >
      {user.avatar ? (
        <img src={user.avatar} alt={user.name} className="w-full h-full rounded-full object-cover" />
      ) : (
        initials
      )}
    </div>
  );
}
