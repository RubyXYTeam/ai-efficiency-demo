import { redirect } from "next/navigation";

export default function MockProductsRedirect() {
  redirect("/console");
}
