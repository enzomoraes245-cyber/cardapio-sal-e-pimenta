/**
 * Ícones das áreas administrativas: traço de 1,75 sobre grade 24×24, cor herdada (currentColor).
 * São decorativos (aria-hidden); o texto do botão ou o aria-label dá o significado.
 */
function createIcon(displayName, shapes) {
  function Icon({ size = 20, className, ...props }) {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        width={size}
        height={size}
        fill="none"
        stroke="currentColor"
        strokeWidth={1.75}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        focusable="false"
        className={className}
        {...props}
      >
        {shapes}
      </svg>
    );
  }
  Icon.displayName = displayName;
  return Icon;
}

export const HomeIcon = createIcon(
  'HomeIcon',
  <>
    <path d="M3 10.5 12 3l9 7.5" />
    <path d="M5 9.5V20a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1V9.5" />
  </>,
);

export const OverviewIcon = createIcon(
  'OverviewIcon',
  <>
    <rect x="3" y="3" width="7" height="9" rx="1.5" />
    <rect x="14" y="3" width="7" height="5" rx="1.5" />
    <rect x="14" y="12" width="7" height="9" rx="1.5" />
    <rect x="3" y="16" width="7" height="5" rx="1.5" />
  </>,
);

export const PackageIcon = createIcon(
  'PackageIcon',
  <>
    <path d="M21 8 12 3 3 8v8l9 5 9-5V8Z" />
    <path d="m3 8 9 5 9-5" />
    <path d="M12 13v8" />
  </>,
);

export const LayersIcon = createIcon(
  'LayersIcon',
  <>
    <path d="m12 3 9 5-9 5-9-5 9-5Z" />
    <path d="m3 13 9 5 9-5" />
  </>,
);

export const StoreIcon = createIcon(
  'StoreIcon',
  <>
    <path d="M3 9 4.5 4h15L21 9" />
    <path d="M3 9a3 3 0 0 0 6 0 3 3 0 0 0 6 0 3 3 0 0 0 6 0" />
    <path d="M5 11.5V20h14v-8.5" />
    <path d="M10 20v-5h4v5" />
  </>,
);

export const UtensilsIcon = createIcon(
  'UtensilsIcon',
  <>
    <path d="M5 3v5a2 2 0 0 0 2 2h0a2 2 0 0 0 2-2V3" />
    <path d="M7 3v18" />
    <path d="M17 21V3c-2 1.4-3 4-3 7v4h3" />
  </>,
);

export const PaletteIcon = createIcon(
  'PaletteIcon',
  <>
    <path d="M12 3a9 9 0 1 0 0 18c1.1 0 1.6-.8 1.6-1.6 0-.5-.2-.9-.5-1.3-.3-.4-.5-.8-.5-1.3 0-.9.7-1.6 1.6-1.6H16a5 5 0 0 0 5-5c0-4-4-7.2-9-7.2Z" />
    <circle cx="7.5" cy="11.5" r="1" fill="currentColor" stroke="none" />
    <circle cx="10" cy="7.5" r="1" fill="currentColor" stroke="none" />
    <circle cx="15" cy="8" r="1" fill="currentColor" stroke="none" />
  </>,
);

export const QrCodeIcon = createIcon(
  'QrCodeIcon',
  <>
    <rect x="3.5" y="3.5" width="6.5" height="6.5" rx="1" />
    <rect x="14" y="3.5" width="6.5" height="6.5" rx="1" />
    <rect x="3.5" y="14" width="6.5" height="6.5" rx="1" />
    <path d="M14 14h2.5v2.5H14z" />
    <path d="M20.5 14v.01M14 20.5v.01M17.5 20.5h3v-3" />
  </>,
);

export const ExternalLinkIcon = createIcon(
  'ExternalLinkIcon',
  <>
    <path d="M14 4h6v6" />
    <path d="M20 4 11 13" />
    <path d="M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" />
  </>,
);

export const UserIcon = createIcon(
  'UserIcon',
  <>
    <circle cx="12" cy="8" r="4" />
    <path d="M4 21a8 8 0 0 1 16 0" />
  </>,
);

export const UsersIcon = createIcon(
  'UsersIcon',
  <>
    <circle cx="9" cy="8" r="3.5" />
    <path d="M2.5 20a6.5 6.5 0 0 1 13 0" />
    <path d="M16 4.6a3.5 3.5 0 0 1 0 6.8" />
    <path d="M18 14.2a6.5 6.5 0 0 1 3.5 5.8" />
  </>,
);

export const LogoutIcon = createIcon(
  'LogoutIcon',
  <>
    <path d="M9 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h3" />
    <path d="m16 17 5-5-5-5" />
    <path d="M21 12H9" />
  </>,
);

export const MenuIcon = createIcon('MenuIcon', <path d="M4 7h16M4 12h16M4 17h16" />);

export const XIcon = createIcon('XIcon', <path d="M6 6l12 12M18 6 6 18" />);

export const PlusIcon = createIcon('PlusIcon', <path d="M12 5v14M5 12h14" />);

export const SearchIcon = createIcon(
  'SearchIcon',
  <>
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.5-3.5" />
  </>,
);

export const ChevronDownIcon = createIcon('ChevronDownIcon', <path d="m6 9 6 6 6-6" />);
export const ChevronLeftIcon = createIcon('ChevronLeftIcon', <path d="m15 18-6-6 6-6" />);
export const ChevronRightIcon = createIcon('ChevronRightIcon', <path d="m9 18 6-6-6-6" />);
export const ArrowUpIcon = createIcon('ArrowUpIcon', <path d="M12 19V5M5.5 11.5 12 5l6.5 6.5" />);
export const ArrowDownIcon = createIcon(
  'ArrowDownIcon',
  <path d="M12 5v14M18.5 12.5 12 19l-6.5-6.5" />,
);

export const CheckIcon = createIcon('CheckIcon', <path d="m5 12.5 4.5 4.5L19 7.5" />);

export const AlertTriangleIcon = createIcon(
  'AlertTriangleIcon',
  <>
    <path d="M10.3 4.2 2.6 17.6A2 2 0 0 0 4.3 20.6h15.4a2 2 0 0 0 1.7-3L13.7 4.2a2 2 0 0 0-3.4 0Z" />
    <path d="M12 9.5v4" />
    <path d="M12 17v.01" />
  </>,
);

export const AlertCircleIcon = createIcon(
  'AlertCircleIcon',
  <>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7.5V13" />
    <path d="M12 16.5v.01" />
  </>,
);

export const InfoIcon = createIcon(
  'InfoIcon',
  <>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 11v5.5" />
    <path d="M12 7.5v.01" />
  </>,
);

export const CircleCheckIcon = createIcon(
  'CircleCheckIcon',
  <>
    <circle cx="12" cy="12" r="9" />
    <path d="m8.5 12.5 2.5 2.5 4.5-5" />
  </>,
);

export const CopyIcon = createIcon(
  'CopyIcon',
  <>
    <rect x="9" y="9" width="11" height="11" rx="2" />
    <path d="M5 15H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1" />
  </>,
);

export const DownloadIcon = createIcon(
  'DownloadIcon',
  <>
    <path d="M12 4v11" />
    <path d="m7 10 5 5 5-5" />
    <path d="M5 20h14" />
  </>,
);

export const UploadIcon = createIcon(
  'UploadIcon',
  <>
    <path d="M12 20V9" />
    <path d="m7 14 5-5 5 5" />
    <path d="M5 4h14" />
  </>,
);

export const PrinterIcon = createIcon(
  'PrinterIcon',
  <>
    <path d="M7 9V3h10v6" />
    <path d="M7 17H5a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-2" />
    <path d="M7 14h10v7H7z" />
  </>,
);

export const EyeIcon = createIcon(
  'EyeIcon',
  <>
    <path d="M2.5 12S6 5 12 5s9.5 7 9.5 7-3.5 7-9.5 7-9.5-7-9.5-7Z" />
    <circle cx="12" cy="12" r="3" />
  </>,
);

export const EyeOffIcon = createIcon(
  'EyeOffIcon',
  <>
    <path d="m3 3 18 18" />
    <path d="M10.6 5.1A9.7 9.7 0 0 1 12 5c6 0 9.5 7 9.5 7a17.6 17.6 0 0 1-3 3.9" />
    <path d="M6.6 6.6C4 8.4 2.5 12 2.5 12S6 19 12 19a9.4 9.4 0 0 0 5.4-1.6" />
    <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
  </>,
);

export const ImageIcon = createIcon(
  'ImageIcon',
  <>
    <rect x="3" y="4" width="18" height="16" rx="2" />
    <circle cx="9" cy="10" r="2" />
    <path d="m21 16-5-5-9 9" />
  </>,
);

export const TrashIcon = createIcon(
  'TrashIcon',
  <>
    <path d="M4 7h16" />
    <path d="M10 11v6M14 11v6" />
    <path d="M6 7l1 13h10l1-13" />
    <path d="M9 7V4h6v3" />
  </>,
);

export const PencilIcon = createIcon(
  'PencilIcon',
  <>
    <path d="M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16v4Z" />
    <path d="m13.5 6.5 4 4" />
  </>,
);

export const LockIcon = createIcon(
  'LockIcon',
  <>
    <rect x="4" y="11" width="16" height="10" rx="2" />
    <path d="M8 11V7a4 4 0 0 1 8 0v4" />
  </>,
);

export const UnlockIcon = createIcon(
  'UnlockIcon',
  <>
    <rect x="4" y="11" width="16" height="10" rx="2" />
    <path d="M8 11V7a4 4 0 0 1 7.6-1.8" />
  </>,
);

export const KeyIcon = createIcon(
  'KeyIcon',
  <>
    <circle cx="8" cy="15" r="4" />
    <path d="m11 12 9-9" />
    <path d="m17 6 3 3" />
    <path d="m14.5 8.5 2 2" />
  </>,
);

export const MailIcon = createIcon(
  'MailIcon',
  <>
    <rect x="3" y="5" width="18" height="14" rx="2" />
    <path d="m3.5 6.5 8.5 6.5 8.5-6.5" />
  </>,
);

export const PhoneIcon = createIcon(
  'PhoneIcon',
  <path d="M5 4h3.5l2 5-2.5 1.5a11 11 0 0 0 5.5 5.5L15 13.5l5 2V19a1 1 0 0 1-1 1A16 16 0 0 1 4 5a1 1 0 0 1 1-1Z" />,
);

export const CalendarIcon = createIcon(
  'CalendarIcon',
  <>
    <rect x="3" y="5" width="18" height="16" rx="2" />
    <path d="M16 3v4M8 3v4M3 10h18" />
  </>,
);

export const ReceiptIcon = createIcon(
  'ReceiptIcon',
  <>
    <path d="M6 3h12v18l-3-2-3 2-3-2-3 2V3Z" />
    <path d="M9 8h6M9 12h6M9 16h3" />
  </>,
);

export const BanknoteIcon = createIcon(
  'BanknoteIcon',
  <>
    <rect x="2.5" y="6" width="19" height="12" rx="2" />
    <circle cx="12" cy="12" r="2.5" />
    <path d="M6 9.5v.01M18 14.5v.01" />
  </>,
);

export const ClockIcon = createIcon(
  'ClockIcon',
  <>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 2" />
  </>,
);

export const PauseCircleIcon = createIcon(
  'PauseCircleIcon',
  <>
    <circle cx="12" cy="12" r="9" />
    <path d="M10 9v6M14 9v6" />
  </>,
);

export const PlayCircleIcon = createIcon(
  'PlayCircleIcon',
  <>
    <circle cx="12" cy="12" r="9" />
    <path d="m10 8.5 5 3.5-5 3.5v-7Z" />
  </>,
);

export const UndoIcon = createIcon(
  'UndoIcon',
  <>
    <path d="M9 14 4 9l5-5" />
    <path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11" />
  </>,
);

export const ToggleIcon = createIcon(
  'ToggleIcon',
  <>
    <rect x="2.5" y="7" width="19" height="10" rx="5" />
    <circle cx="16.5" cy="12" r="2.5" />
  </>,
);

export const LinkIcon = createIcon(
  'LinkIcon',
  <>
    <path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1" />
    <path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1" />
  </>,
);

export const RefreshIcon = createIcon(
  'RefreshIcon',
  <>
    <path d="M20 11a8 8 0 0 0-14.9-3.5" />
    <path d="M4 4v4h4" />
    <path d="M4 13a8 8 0 0 0 14.9 3.5" />
    <path d="M20 20v-4h-4" />
  </>,
);

export const ShieldIcon = createIcon(
  'ShieldIcon',
  <>
    <path d="M12 3 5 6v6c0 4.2 2.9 7.6 7 9 4.1-1.4 7-4.8 7-9V6l-7-3Z" />
    <path d="m9 12 2 2 4-4" />
  </>,
);
