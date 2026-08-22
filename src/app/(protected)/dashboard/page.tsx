import { redirect } from "next/navigation";
import { requireUser } from "@/lib/authz";

export default async function Dashboard() {
  const user = await requireUser();
  if (user.rol === "ADMIN") redirect("/admin");
  if (user.rol === "DOCTOR") redirect("/mi-consulta");
  if (user.rol === "ANESTESIOLOGO") redirect("/anestesiologia");
  redirect("/enfermeria");
}
