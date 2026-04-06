import type { IconType } from "react-icons";
import {
  FaFacebook,
  FaInstagram,
  FaSnapchat,
  FaTiktok,
  FaYoutube,
} from "react-icons/fa6";
import { FaXTwitter } from "react-icons/fa6";
import type { SocialLinkKey } from "@/lib/social-links";

/** Brand-colored tile + FA6 official marks (react-icons). */
const PLATFORM: Record<
  SocialLinkKey,
  { Icon: IconType; wrap: string; icon: string }
> = {
  instagram: {
    Icon: FaInstagram,
    wrap: "bg-gradient-to-br from-[#833ab4] via-[#e1306c] to-[#fcb045] ring-1 ring-white/15",
    icon: "text-white drop-shadow-sm",
  },
  facebook: {
    Icon: FaFacebook,
    wrap: "bg-[#1877F2] ring-1 ring-black/5",
    icon: "text-white",
  },
  tiktok: {
    Icon: FaTiktok,
    wrap: "bg-black ring-1 ring-white/10",
    icon: "text-white",
  },
  youtube: {
    Icon: FaYoutube,
    wrap: "bg-[#FF0000] ring-1 ring-black/10",
    icon: "text-white",
  },
  snapchat: {
    Icon: FaSnapchat,
    wrap: "bg-[#FFFC00] ring-1 ring-black/10",
    icon: "text-black",
  },
  twitter: {
    Icon: FaXTwitter,
    wrap: "bg-black ring-1 ring-white/10 dark:bg-white dark:ring-black/10",
    icon: "text-white dark:text-black",
  },
};

const TILE =
  "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl shadow-sm";

export function SocialPlatformIcon({ platform }: { platform: SocialLinkKey }) {
  const { Icon, wrap, icon } = PLATFORM[platform];
  return (
    <span className={`${TILE} ${wrap}`} aria-hidden>
      <Icon className={`h-[22px] w-[22px] ${icon}`} aria-hidden />
    </span>
  );
}
