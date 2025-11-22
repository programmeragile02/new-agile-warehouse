"use client";

import Image from "next/image";
import clsx from "clsx";

interface NataLogoProps {
    size?: "sm" | "md" | "lg";
    className?: string;
    rounded?: boolean;
}

export function NataLogo({ size = "md", className, rounded = true }: NataLogoProps) {
    const dimension = size === "sm" ? 40 : size === "md" ? 64 : 96; // bebas atur sendiri

    return (
        <Image
            src="logo_natabanyu.png" // path ke logo kamu
            alt="Nata Banyu Logo"
            width={dimension}
            height={dimension}
            className={clsx(
                "object-cover",
                rounded && "rounded-full shadow-md ring-1 ring-white/30",
                className
            )}
            priority
        />
    );
}
