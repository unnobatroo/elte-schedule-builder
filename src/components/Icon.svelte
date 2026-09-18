<script module lang="ts">
  export type IconName =
    | "alert-triangle"
    | "calendar"
    | "check"
    | "chevron-down"
    | "chevron-left"
    | "chevron-right"
    | "chevron-up"
    | "clock"
    | "download"
    | "external-link"
    | "info"
    | "mail"
    | "map-pin"
    | "monitor"
    | "moon"
    | "pencil"
    | "plus"
    | "book-open"
    | "rotate-ccw"
    | "search"
    | "send"
    | "smartphone"
    | "sparkles"
    | "sun"
    | "trash"
    | "upload"
    | "user"
    | "x";
</script>

<script lang="ts">
  import AlertTriangle from "@lucide/svelte/icons/triangle-alert";
  import Calendar from "@lucide/svelte/icons/calendar";
  import Check from "@lucide/svelte/icons/check";
  import ChevronDown from "@lucide/svelte/icons/chevron-down";
  import ChevronLeft from "@lucide/svelte/icons/chevron-left";
  import ChevronRight from "@lucide/svelte/icons/chevron-right";
  import ChevronUp from "@lucide/svelte/icons/chevron-up";
  import Clock from "@lucide/svelte/icons/clock";
  import Download from "@lucide/svelte/icons/download";
  import ExternalLink from "@lucide/svelte/icons/external-link";
  import Info from "@lucide/svelte/icons/info";
  import Mail from "@lucide/svelte/icons/mail";
  import MapPin from "@lucide/svelte/icons/map-pin";
  import Monitor from "@lucide/svelte/icons/monitor";
  import Moon from "@lucide/svelte/icons/moon";
  import Pencil from "@lucide/svelte/icons/pencil";
  import Plus from "@lucide/svelte/icons/plus";
  import BookOpen from "@lucide/svelte/icons/book-open";
  import RotateCcw from "@lucide/svelte/icons/rotate-ccw";
  import Search from "@lucide/svelte/icons/search";
  import Send from "@lucide/svelte/icons/send";
  import Smartphone from "@lucide/svelte/icons/smartphone";
  import Sparkles from "@lucide/svelte/icons/sparkles";
  import Sun from "@lucide/svelte/icons/sun";
  import Trash from "@lucide/svelte/icons/trash";
  import Upload from "@lucide/svelte/icons/upload";
  import User from "@lucide/svelte/icons/user";
  import X from "@lucide/svelte/icons/x";

  const ICONS = {
    "alert-triangle": AlertTriangle,
    calendar: Calendar,
    check: Check,
    "chevron-down": ChevronDown,
    "chevron-left": ChevronLeft,
    "chevron-right": ChevronRight,
    "chevron-up": ChevronUp,
    clock: Clock,
    download: Download,
    "external-link": ExternalLink,
    info: Info,
    mail: Mail,
    "map-pin": MapPin,
    monitor: Monitor,
    moon: Moon,
    pencil: Pencil,
    plus: Plus,
    "book-open": BookOpen,
    "rotate-ccw": RotateCcw,
    search: Search,
    send: Send,
    smartphone: Smartphone,
    sparkles: Sparkles,
    sun: Sun,
    trash: Trash,
    upload: Upload,
    user: User,
    x: X,
  };

  interface Props {
    name: IconName | string;
    size?: number | string;
    strokeWidth?: number | string;
    label?: string;
  }

  let { name, size = 18, strokeWidth = 2, label = "" }: Props = $props();

  const IconComponent = $derived(ICONS[name as IconName]);
</script>

{#if IconComponent}
  <IconComponent
    {size}
    {strokeWidth}
    class="icon"
    role={label ? "img" : undefined}
    aria-label={label || undefined}
    aria-hidden={label ? undefined : "true"}
  />
{/if}

<style>
  :global(.icon) {
    flex-shrink: 0;
    vertical-align: middle;
  }
</style>
