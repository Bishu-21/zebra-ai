import Image from "next/image";

type ZebraLoaderProps = {
    label?: string;
    detail?: string;
    variant?: "page" | "inline";
};

export function ZebraLoader({
    label = "Loading your workspace",
    detail = "Zebra is moving things into place.",
    variant = "page",
}: ZebraLoaderProps) {
    return (
        <section
            className={`zebra-loader zebra-loader--${variant}`}
            role="status"
            aria-live="polite"
            aria-label={label}
        >
            <div className="zebra-loader__scene" aria-hidden="true">
                <div className="zebra-loader__mark">
                    <Image
                        src="/zebra_star.svg"
                        alt=""
                        width={807}
                        height={807}
                        priority={variant === "page"}
                    />
                </div>
                <div className="zebra-loader__contact zebra-loader__contact--front" />
                <div className="zebra-loader__contact zebra-loader__contact--back" />
                <div className="zebra-loader__ground">
                    <span />
                    <span />
                    <span />
                    <span />
                    <span />
                </div>
            </div>

            <div className="zebra-loader__copy">
                <p className="zebra-loader__label">{label}</p>
                {detail ? <p className="zebra-loader__detail">{detail}</p> : null}
            </div>
        </section>
    );
}
