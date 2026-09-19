'use client';

import React, { useMemo } from "react";
import ExpenseEmployee from "./expenseemployee";
import ExpenseManager from "./expensemanager";
import ExpenseAdmin from "./expenseadmin";

type UserLS = {
  role?: number | string;
  role_id?: number | string;
  user_role?: number | string;
};

function getUserRoleNumber(): number {
  if (typeof window === "undefined") return 0;
  try {
    const user: UserLS = JSON.parse(localStorage.getItem("user") || "{}");
    const rRaw = user?.role ?? user?.role_id ?? user?.user_role ?? 0;
    const r = Number(rRaw) || 0;
    return r;
  } catch {
    return 0;
  }
}

export default function ExpenseTracker() {
  const roleNum = useMemo(() => getUserRoleNumber(), []);


  if (roleNum === 1 || roleNum === 5) return <ExpenseAdmin />;

  // ✅ If you want role=3 to see manager screen, do this:
  // if (roleNum === 3) return <ExpenseManager />;

  // ✅ else employee screen
  return <ExpenseEmployee />;
}
