import Image from "next/image";

interface LogoProps {
  size?: number;
  showText?: boolean;
}

export default function Logo({ size = 40, showText = true }: LogoProps) {
  return (
    <div className="flex items-center gap-3 group">
      {/* Logo Icon */}
      <div className="flex items-center justify-center rounded-xl bg-[var(--brand-gradient)] p-1">
        <div className="bg-background rounded-lg p-1">
          <Image
            src="/logo.png"
            alt="Logo"
            width={size}
            height={size}
            priority
          />
        </div>
      </div>

      {/* Logo Text */}
      {showText && (
        <span className="font-bold text-2xl sm:text-3xl tracking-tight">
          {/* Primary Blue */}
          <span className="text-primary">
            Vaani
          </span>

          {/* Secondary Green – tilted */}
          <span
            className="text-secondary inline-block ml-1"
            style={{ transform: "skewX(-8deg)" }}
          >
            Kaam
          </span>
        </span>
      )}
    </div>
  );
}
