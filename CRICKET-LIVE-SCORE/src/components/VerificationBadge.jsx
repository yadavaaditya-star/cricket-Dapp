import { MdVerified } from "react-icons/md";

export function VerificationBadge({ isVerified }) {
  if (!isVerified) return null;
  return (
    <span style={{
      display: "inline-flex",
      alignItems: "center",
      gap: 3,
      fontSize: 9,
      fontWeight: 800,
      padding: "2px 7px",
      borderRadius: 5,
      flexShrink: 0,
      letterSpacing: "0.06em",
      whiteSpace: "nowrap",
      background: "#dbeafe",
      color: "#1d4ed8",
    }}>
      <MdVerified size={10} />
      VERIFIED
    </span>
  );
}
