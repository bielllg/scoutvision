import { cookies } from "next/headers";

export async function getMotionMode() {
  return (await cookies()).get("scout-motion")?.value === "system" ? "system" : "full";
}
