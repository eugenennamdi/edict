import { redirect } from "next/navigation";

// Root "/" redirects to the Vault Directory
export default function HomePage() {
  redirect("/vaults");
}
