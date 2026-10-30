import {
    RiHome5Line,
    RiBriefcaseLine,
    RiFileTextLine,
    RiFolder2Line,
    RiArticleLine,
    RiGlobalLine,
    RiLinkedinLine,
    RiLineChartLine,
    RiSettings4Line,
} from "react-icons/ri";
import { AppIcon } from "@/components/ui/AppIcon";

export const featureIcons = {
    Home: RiHome5Line,
    Applications: RiBriefcaseLine,
    Resumes: RiFileTextLine,
    Work: RiFolder2Line,
    "Cover Letters": RiArticleLine,
    Portfolio: RiGlobalLine,
    "LinkedIn Optimizer": RiLinkedinLine,
    Analytics: RiLineChartLine,
    Settings: RiSettings4Line,
};

export type FeatureName = keyof typeof featureIcons;

export function FeatureIcon({
    feature,
    size = 18,
    className,
}: {
    feature: FeatureName;
    size?: number;
    className?: string;
}) {
    return <AppIcon icon={featureIcons[feature]} size={size} className={className} />;
}
