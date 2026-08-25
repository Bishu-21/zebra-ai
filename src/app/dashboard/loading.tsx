import { Suspense } from "react";
import { ZebraLoader } from "@/components/ui/ZebraLoader";
import { ZebraRouteLoader } from "@/components/ui/ZebraRouteLoader";

export default function DashboardLoading() {
    return (
        <Suspense fallback={<ZebraLoader />}>
            <ZebraRouteLoader />
        </Suspense>
    );
}
