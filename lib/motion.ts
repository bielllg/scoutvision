import { cookies } from "next/headers";

export async function getMotionMode() {
  return (await cookies()).get("scout-motion")?.value === "full" ? "full" : "system";
}
