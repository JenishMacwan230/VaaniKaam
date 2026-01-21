import Image from "next/image";
import Link from "next/link";

interface LogoProps {
  size?: number; // icon size
  showText?: boolean;
}

export default function Logo({ size = 40, showText = true }: LogoProps) {
  return (
    <Link href="/" className="flex items-center gap-3">
      {/* Logo Icon */}
      <div className="flex items-center justify-center">
        <Image
          src="/logo.png"
          alt="VaaniKaam Logo"
          width={size}
          height={size}
          priority
        />
      </div>

      {/* Logo Text */}
      {showText && (
        <span className="font-bold text-2xl sm:text-3xl text-gray-900 dark:text-white">
          Vaani<span className="text-primary">Kaam</span>
        </span>
      )}
    </Link>
  );
}
