import type { IconType } from "react-icons";

type AppIconProps = {
    icon: IconType;
    size?: number;
    className?: string;
};

/** Decorative Remix icon with stable size and no assistive-name. */
export function AppIcon({ icon: Icon, size = 16, className }: AppIconProps) {
    return (
        <Icon
            size={size}
            aria-hidden="true"
            focusable="false"
            className={["shrink-0", className].filter(Boolean).join(" ")}
        />
    );
}
