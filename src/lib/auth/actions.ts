"use server";

import { redirect } from "next/navigation";

import { clearUserSession } from "./server";

export async function logoutAction() {
  await clearUserSession();
  redirect("/login");
}
